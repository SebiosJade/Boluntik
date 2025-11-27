const { 
  findEventParticipantsByEvent,
  updateEventParticipant,
  findEventParticipantById
} = require('../../database/dataAccess');
const logger = require('../../utils/logger');

// Mark attendance for a volunteer
async function markAttendance(req, res) {
  try {
    const { eventId, userId } = req.params;
    const { attendanceStatus, markedBy } = req.body;

    if (!attendanceStatus || !['attended', 'not_attended', 'pending'].includes(attendanceStatus)) {
      return res.status(400).json({ 
        message: 'Invalid attendance status. Must be attended, not_attended, or pending' 
      });
    }

    // Find the participant
    const participants = await findEventParticipantsByEvent(eventId);
    const participant = participants.find(p => p.userId === userId);

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Update attendance
    const updatedParticipant = await updateEventParticipant(eventId, userId, {
      attendanceStatus,
      attendanceMarkedAt: new Date(),
      attendanceMarkedBy: markedBy || 'system'
    });

    logger.info(`Attendance marked: ${attendanceStatus} for user ${userId} in event ${eventId}`);

    res.json({
      success: true,
      message: `Attendance marked as ${attendanceStatus}`,
      participant: updatedParticipant
    });
  } catch (error) {
    logger.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Failed to mark attendance' });
  }
}

// Get attendance status for an event
async function getEventAttendance(req, res) {
  try {
    const { eventId } = req.params;

    const participants = await findEventParticipantsByEvent(eventId);
    
    const attendanceData = participants.map(participant => ({
      id: participant.id,
      userId: participant.userId,
      userName: participant.userName,
      userEmail: participant.userEmail,
      status: participant.status,
      attendanceStatus: participant.attendanceStatus || 'pending',
      attendanceMarkedAt: participant.attendanceMarkedAt,
      attendanceMarkedBy: participant.attendanceMarkedBy,
      registrationDate: participant.registrationDate,
      checkInTime: participant.checkInTime,
      checkOutTime: participant.checkOutTime,
      notes: participant.notes,
      isActive: participant.isActive
    }));

    res.json({
      success: true,
      participants: attendanceData,
      attendance: attendanceData,
      summary: {
        total: participants.length,
        attended: participants.filter(p => p.attendanceStatus === 'attended').length,
        not_attended: participants.filter(p => p.attendanceStatus === 'not_attended').length,
        pending: participants.filter(p => !p.attendanceStatus || p.attendanceStatus === 'pending').length
      }
    });
  } catch (error) {
    logger.error('Error getting event attendance:', error);
    res.status(500).json({ message: 'Failed to get attendance data' });
  }
}

// Bulk mark attendance for multiple volunteers
async function bulkMarkAttendance(req, res) {
  try {
    const { eventId } = req.params;
    const { attendanceData, markedBy } = req.body;

    if (!Array.isArray(attendanceData)) {
      return res.status(400).json({ message: 'attendanceData must be an array' });
    }

    const results = [];
    const errors = [];

    for (const item of attendanceData) {
      try {
        const { userId, attendanceStatus } = item;
        
        if (!['attended', 'not_attended', 'pending'].includes(attendanceStatus)) {
          errors.push({ userId, error: 'Invalid attendance status' });
          continue;
        }

        const updatedParticipant = await updateEventParticipant(eventId, userId, {
          attendanceStatus,
          attendanceMarkedAt: new Date(),
          attendanceMarkedBy: markedBy || 'system'
        });

        results.push({ userId, attendanceStatus, success: true });
      } catch (error) {
        errors.push({ userId: item.userId, error: error.message });
      }
    }

    logger.info(`Bulk attendance marked for event ${eventId}: ${results.length} successful, ${errors.length} errors`);

    res.json({
      success: true,
      message: `Attendance marked for ${results.length} participants`,
      results,
      errors
    });
  } catch (error) {
    logger.error('Error in bulk marking attendance:', error);
    res.status(500).json({ message: 'Failed to mark attendance' });
  }
}

module.exports = {
  markAttendance,
  getEventAttendance,
  bulkMarkAttendance
};

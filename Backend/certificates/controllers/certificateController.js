const { v4: uuidv4 } = require('uuid');
const { findUserById, updateUser } = require('../../database/dataAccess');
const { findEventById } = require('../../database/dataAccess');
const Notification = require('../../models/Notification');

// Helper function to generate event-specific certificate templates
function generateEventSpecificCertificate(event) {
  const eventTitle = event.title.toLowerCase();
  const eventCategory = event.category?.toLowerCase() || 'general';
  
  // Define certificate templates based on event type and category
  const certificateTemplates = {
    // Environmental events
    'environmental': {
      type: 'Environmental Achievement',
      style: 'nature',
      color: '#10B981',
      icon: 'leaf-outline',
      title: 'CERTIFICATE OF ENVIRONMENTAL STEWARDSHIP',
      subtitle: 'This certifies outstanding contribution to environmental conservation',
      footer: 'For dedication to protecting our planet'
    },
    'cleanup': {
      type: 'Community Cleanup',
      style: 'cleanup',
      color: '#059669',
      icon: 'trash-outline',
      title: 'CERTIFICATE OF COMMUNITY CLEANUP',
      subtitle: 'This certifies active participation in community cleanliness',
      footer: 'Thank you for keeping our community clean'
    },
    'tree': {
      type: 'Tree Planting',
      style: 'tree',
      color: '#16A34A',
      icon: 'flower-outline',
      title: 'CERTIFICATE OF TREE PLANTING',
      subtitle: 'This certifies contribution to reforestation efforts',
      footer: 'For helping to grow our green future'
    },
    
    // Social events
    'social': {
      type: 'Social Impact',
      style: 'social',
      color: '#3B82F6',
      icon: 'people-outline',
      title: 'CERTIFICATE OF SOCIAL IMPACT',
      subtitle: 'This certifies meaningful contribution to social causes',
      footer: 'For making a positive difference in our community'
    },
    'education': {
      type: 'Educational Service',
      style: 'education',
      color: '#8B5CF6',
      icon: 'school-outline',
      title: 'CERTIFICATE OF EDUCATIONAL SERVICE',
      subtitle: 'This certifies dedication to educational advancement',
      footer: 'For empowering minds and building futures'
    },
    'health': {
      type: 'Health & Wellness',
      style: 'health',
      color: '#EF4444',
      icon: 'heart-outline',
      title: 'CERTIFICATE OF HEALTH SERVICE',
      subtitle: 'This certifies contribution to community health and wellness',
      footer: 'For caring for our community\'s wellbeing'
    },
    
    // Emergency and disaster relief
    'emergency': {
      type: 'Emergency Response',
      style: 'emergency',
      color: '#DC2626',
      icon: 'medical-outline',
      title: 'CERTIFICATE OF EMERGENCY RESPONSE',
      subtitle: 'This certifies courageous service during emergency situations',
      footer: 'For bravery and service in times of need'
    },
    'disaster': {
      type: 'Disaster Relief',
      style: 'disaster',
      color: '#B91C1C',
      icon: 'warning-outline',
      title: 'CERTIFICATE OF DISASTER RELIEF',
      subtitle: 'This certifies compassionate service during disaster recovery',
      footer: 'For providing hope and support in difficult times'
    },
    
    // Technology and innovation
    'technology': {
      type: 'Technology Service',
      style: 'tech',
      color: '#6366F1',
      icon: 'hardware-chip-outline',
      title: 'CERTIFICATE OF TECHNOLOGY SERVICE',
      subtitle: 'This certifies contribution to digital advancement',
      footer: 'For bridging the digital divide'
    },
    'innovation': {
      type: 'Innovation Award',
      style: 'innovation',
      color: '#7C3AED',
      icon: 'bulb-outline',
      title: 'CERTIFICATE OF INNOVATION',
      subtitle: 'This certifies creative problem-solving and innovation',
      footer: 'For thinking outside the box and creating solutions'
    },
    
    // Arts and culture
    'arts': {
      type: 'Arts & Culture',
      style: 'arts',
      color: '#EC4899',
      icon: 'color-palette-outline',
      title: 'CERTIFICATE OF ARTS SERVICE',
      subtitle: 'This certifies contribution to arts and culture',
      footer: 'For enriching our community through creativity'
    },
    'culture': {
      type: 'Cultural Service',
      style: 'culture',
      color: '#BE185D',
      icon: 'library-outline',
      title: 'CERTIFICATE OF CULTURAL SERVICE',
      subtitle: 'This certifies dedication to preserving and promoting culture',
      footer: 'For celebrating and sharing our cultural heritage'
    },
    
    // Sports and recreation
    'sports': {
      type: 'Sports Service',
      style: 'sports',
      color: '#F59E0B',
      icon: 'football-outline',
      title: 'CERTIFICATE OF SPORTS SERVICE',
      subtitle: 'This certifies contribution to sports and recreation',
      footer: 'For promoting healthy living and team spirit'
    },
    
    // Default template
    'default': {
      type: 'Volunteer Recognition',
      style: 'general',
      color: '#1E40AF',
      icon: 'ribbon-outline',
      title: 'CERTIFICATE OF VOLUNTEER SERVICE',
      subtitle: 'This certifies outstanding volunteer contribution',
      footer: 'For dedicated service to our community'
    }
  };
  
  // Determine the best template based on event title and category
  let selectedTemplate = certificateTemplates.default;
  
  // Check for specific keywords in event title (prioritize more specific matches)
  const specificKeywords = ['cleanup', 'tree', 'health', 'emergency', 'disaster', 'technology', 'innovation', 'arts', 'culture', 'sports'];
  
  // First check for specific keywords
  for (const keyword of specificKeywords) {
    if (eventTitle.includes(keyword) || eventCategory.includes(keyword)) {
      if (certificateTemplates[keyword]) {
        selectedTemplate = certificateTemplates[keyword];
        break;
      }
    }
  }
  
  // If no specific match, check for general categories
  if (selectedTemplate === certificateTemplates.default) {
    for (const [key, template] of Object.entries(certificateTemplates)) {
      if (key !== 'default' && key !== 'cleanup' && key !== 'tree' && 
          (eventTitle.includes(key) || eventCategory.includes(key))) {
        selectedTemplate = template;
        break;
      }
    }
  }
  
  return selectedTemplate;
}

// Helper function to generate unique certificate identifier
function generateUniqueCertificateId(event, volunteer, organizationId) {
  const eventCode = event.title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
  const volunteerCode = volunteer.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase();
  const orgCode = organizationId.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString(36).substring(0, 4).toUpperCase();
  
  return `${eventCode}-${volunteerCode}-${orgCode}-${timestamp}`;
}

// Award certificates to volunteers for an event
const awardCertificates = async (req, res) => {
  try {
    const { eventId, volunteerIds, message, organizationId, useTemplate, templateData } = req.body;

    // Validate required fields
    if (!eventId || !volunteerIds || !Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Event ID and volunteer IDs are required' 
      });
    }

    // Verify the event exists and belongs to the organization
    const event = await findEventById(eventId);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    if (event.organizationId !== organizationId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only award certificates for your own events' 
      });
    }

    const awardedCertificates = [];
    const errors = [];

    // Award certificate to each volunteer
    for (const volunteerId of volunteerIds) {
      try {
        // Get volunteer information
        const volunteer = await findUserById(volunteerId);
        if (!volunteer) {
          errors.push(`❌ Volunteer with ID ${volunteerId} not found in the system`);
          continue;
        }

        // Generate certificate template first to get the actual certificate type
        let certificateTemplate;
        if (useTemplate && templateData) {
          // Use custom template - use title as the certificate type for uniqueness
          certificateTemplate = {
            type: templateData.title || templateData.type || 'Custom Certificate',
            style: templateData.style || 'custom',
            color: templateData.color || '#1E40AF',
            icon: templateData.icon || 'ribbon-outline',
            title: templateData.title || 'CERTIFICATE OF APPRECIATION',
            subtitle: templateData.subtitle || templateData.description || 'This certifies outstanding contribution',
            footer: templateData.footer || 'Thank you for your dedication'
          };
        } else {
          // Use event-specific template
          certificateTemplate = generateEventSpecificCertificate(event);
        }
        
        // Now check for duplicate using the actual certificate type that will be saved
        const certificateType = certificateTemplate.type;
        
        // Check for duplicate certificates (same event + same type)
        const existingCertificate = volunteer.certificates?.find(cert => 
          cert.eventId === eventId && 
          cert.status === 'awarded' && 
          cert.certificateType === certificateType
        );
        
        if (existingCertificate) {
          errors.push(`❌ ${volunteer.name} already has a ${certificateType} certificate for "${event.title}"`);
          continue;
        }

        // Create certificate data with detailed event information
        const finalMessage = message || `Certificate of participation for ${event.title}`;
        
        const certificate = {
          id: uuidv4(),
          eventId: eventId,
          eventTitle: event.title,
          eventDate: event.date,
          eventStartTime: event.time || 'TBD',
          eventEndTime: event.endTime || 'TBD',
          eventLocation: event.location || 'TBD',
          eventDescription: event.description || '',
          eventCategory: event.category || 'General',
          eventType: event.type || 'volunteer',
          volunteerId: volunteerId,
          volunteerName: volunteer.name,
          volunteerEmail: volunteer.email,
          organizationId: organizationId,
          organizationName: event.organizationName,
          message: finalMessage,
          awardedAt: new Date().toISOString(),
          status: 'awarded',
          // Event-specific certificate properties
          certificateType: certificateTemplate.type,
          certificateStyle: certificateTemplate.style,
          certificateColor: certificateTemplate.color,
          certificateIcon: certificateTemplate.icon,
          certificateTitle: certificateTemplate.title,
          certificateSubtitle: certificateTemplate.subtitle,
          certificateFooter: certificateTemplate.footer,
          uniqueIdentifier: generateUniqueCertificateId(event, volunteer, organizationId)
        };

        // Add certificate to volunteer's certificates array
        const currentCertificates = volunteer.certificates || [];
        const updatedCertificates = [...currentCertificates, certificate];

        // Update volunteer with new certificate
        await updateUser(volunteerId, {
          certificates: updatedCertificates,
          certificatesUpdatedAt: new Date().toISOString()
        });

        // Send notification to volunteer
        try {
          await Notification.createCertificateNotification(
            volunteerId,
            event.title,
            certificateType,
            event.organizationName || 'the organization',
            certificate.id
          );
        } catch (notifError) {
          console.error(`Error sending certificate notification to ${volunteer.name}:`, notifError);
          // Don't fail the certificate award if notification fails
        }

        awardedCertificates.push(certificate);
      } catch (error) {
        console.error(`Error awarding certificate to volunteer ${volunteerId}:`, error);
        errors.push(`❌ System error while awarding certificate to volunteer ${volunteerId}: ${error.message}`);
      }
    }

    // Return response
    if (awardedCertificates.length > 0) {
      let message = `Successfully awarded ${awardedCertificates.length} certificate${awardedCertificates.length > 1 ? 's' : ''}`;
      
      if (errors.length > 0) {
        message += `. However, ${errors.length} volunteer${errors.length > 1 ? 's' : ''} could not be awarded certificates:`;
        errors.forEach((error, index) => {
          message += `\n${index + 1}. ${error}`;
        });
      }

      res.json({
        success: true,
        message: message,
        certificates: awardedCertificates,
        errors: errors.length > 0 ? errors : undefined,
        errorCount: errors.length,
        successCount: awardedCertificates.length
      });
    } else {
      let message = 'Failed to award any certificates. Reasons:';
      errors.forEach((error, index) => {
        message += `\n${index + 1}. ${error}`;
      });

      res.status(400).json({
        success: false,
        message: message,
        errors: errors,
        errorCount: errors.length,
        successCount: 0
      });
    }

  } catch (error) {
    console.error('Error in awardCertificates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get certificates for a specific volunteer
const getVolunteerCertificates = async (req, res) => {
  try {
    const { volunteerId } = req.params;

    const volunteer = await findUserById(volunteerId);
    if (!volunteer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Volunteer not found' 
      });
    }

    const certificates = volunteer.certificates || [];

    res.json({
      success: true,
      certificates: certificates
    });

  } catch (error) {
    console.error('Error in getVolunteerCertificates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get all certificates awarded by an organization
const getOrganizationCertificates = async (req, res) => {
  try {
    const { organizationId } = req.params;

    // This would require a more complex query to get all certificates
    // For now, we'll return a placeholder response
    res.json({
      success: true,
      message: 'Organization certificates endpoint - to be implemented',
      certificates: []
    });

  } catch (error) {
    console.error('Error in getOrganizationCertificates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Generate certificate preview/download data
const generateCertificate = async (req, res) => {
  try {
    const { certificateId, volunteerId } = req.params;

    // Get volunteer information
    const volunteer = await findUserById(volunteerId);
    if (!volunteer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Volunteer not found' 
      });
    }

    // Find the specific certificate
    const certificates = volunteer.certificates || [];
    const certificate = certificates.find(cert => cert.id === certificateId);
    
    if (!certificate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Certificate not found' 
      });
    }

    // Generate certificate data for preview/download with actual template information
    const certificateData = {
      id: certificate.id,
      volunteerName: certificate.volunteerName,
      eventTitle: certificate.eventTitle,
      eventDate: certificate.eventDate,
      eventTime: certificate.eventTime,
      eventLocation: certificate.eventLocation,
      eventDescription: certificate.eventDescription,
      organizationName: certificate.organizationName,
      message: certificate.message,
      awardedAt: certificate.awardedAt,
      status: certificate.status,
      // Use the actual template information that was saved when the certificate was awarded
      certificateType: certificate.certificateType,
      certificateStyle: certificate.certificateStyle,
      certificateColor: certificate.certificateColor,
      certificateIcon: certificate.certificateIcon,
      certificateTitle: certificate.certificateTitle,
      certificateSubtitle: certificate.certificateSubtitle,
      certificateFooter: certificate.certificateFooter,
      uniqueIdentifier: certificate.uniqueIdentifier
    };
    
    res.json({
      success: true,
      certificate: certificateData
    });

  } catch (error) {
    console.error('Error in generateCertificate:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Verify certificate authenticity
const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    // Search for certificate across all users
    const users = await findUsersByQuery({});
    let foundCertificate = null;
    let volunteerInfo = null;

    for (const user of users) {
      if (user.certificates) {
        const certificate = user.certificates.find(cert => cert.id === certificateId);
        if (certificate) {
          foundCertificate = certificate;
          volunteerInfo = {
            name: user.name,
            email: user.email
          };
          break;
        }
      }
    }

    if (!foundCertificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or invalid',
        valid: false
      });
    }

    // Return verification details
    res.json({
      success: true,
      valid: true,
      certificate: {
        id: foundCertificate.id,
        volunteerName: foundCertificate.volunteerName,
        eventTitle: foundCertificate.eventTitle,
        eventDate: foundCertificate.eventDate,
        organizationName: foundCertificate.organizationName,
        awardedAt: foundCertificate.awardedAt,
        status: foundCertificate.status,
        verificationDate: new Date().toISOString()
      },
      volunteer: volunteerInfo
    });

  } catch (error) {
    console.error('Error in verifyCertificate:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      valid: false
    });
  }
};



// Upload certificate PDF
const uploadCertificatePDF = async (req, res) => {
  try {
    const { certificateId, volunteerId, organizationName, eventTitle } = req.body;
    const file = req.file;

    // Validate required fields
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    if (!certificateId || !volunteerId) {
      return res.status(400).json({
        success: false,
        message: 'Certificate ID and volunteer ID are required'
      });
    }

    // Generate file URL (adjust based on your server setup)
    const fileUrl = `${process.env.API_URL || 'http://localhost:4000'}/uploads/certificates/${file.filename}`;

    // You can optionally save the PDF URL to the certificate record in the database
    // For now, we'll just return the file URL

    res.json({
      success: true,
      message: 'PDF uploaded successfully',
      fileUrl,
      fileName: file.filename,
      fileSize: file.size
    });

  } catch (error) {
    console.error('Error in uploadCertificatePDF:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  awardCertificates,
  getVolunteerCertificates,
  getOrganizationCertificates,
  generateCertificate,
  verifyCertificate,
  uploadCertificatePDF
};

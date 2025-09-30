const jwt = require('jsonwebtoken');
const { findUserById, updateUser } = require('../../database/dataAccess');
const config = require('../../config'); // Use config instead of direct env access
const { INTERESTS, getValidInterestIds } = require('../../constants/interests');

// Get user interests
async function getUserInterests(req, res) {
  console.log('=== GET USER INTERESTS DEBUG ===');
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  console.log('Token present:', !!token);
  
  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    console.log('Token payload:', payload);
    const user = await findUserById(payload.sub);
    console.log('Found user:', user);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      interests: user.interests || [],
      hasCompletedOnboarding: user.hasCompletedOnboarding || false
    });
  } catch (error) {
    console.error('Error getting user interests:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Update user interests
async function updateUserInterests(req, res) {
  console.log('=== UPDATE USER INTERESTS DEBUG ===');
  console.log('Request body:', req.body);
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  console.log('Token present:', !!token);
  
  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  const { interests } = req.body || {};

  if (!Array.isArray(interests)) {
    return res.status(400).json({ message: 'Interests must be an array' });
  }

  // Validate interest IDs using shared configuration
  const validInterests = getValidInterestIds();
  const invalidInterests = interests.filter(interest => !validInterests.includes(interest));
  if (invalidInterests.length > 0) {
    return res.status(400).json({ 
      message: `Invalid interests: ${invalidInterests.join(', ')}`,
      validInterests 
    });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    console.log('Token payload:', payload);
    const user = await findUserById(payload.sub);
    console.log('Found user:', user);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user interests and onboarding status using MongoDB
    console.log('Updating user interests:', interests);
    await updateUser(user.id, {
      interests: interests,
      hasCompletedOnboarding: true,
      interestsUpdatedAt: new Date().toISOString()
    });


    res.json({ 
      success: true,
      message: 'Interests updated successfully',
      interests: interests,
      hasCompletedOnboarding: true
    });
  } catch (error) {
    console.error('Error updating user interests:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Get all available interests (for reference)
async function getAvailableInterests(req, res) {
  res.json({ interests: INTERESTS });
}

module.exports = {
  getUserInterests,
  updateUserInterests,
  getAvailableInterests
};

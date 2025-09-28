const jwt = require('jsonwebtoken');
const { readUsers, writeUsers, findUserById, updateUser } = require('../../database/dataAccess');
const config = require('../../config'); // Use config instead of direct env access

// Get user interests
async function getUserInterests(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const users = await readUsers();
    const user = users.find((u) => u.id === payload.sub);
    
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
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  const { interests } = req.body || {};

  if (!Array.isArray(interests)) {
    return res.status(400).json({ message: 'Interests must be an array' });
  }

  // Validate interest IDs
  const validInterests = [
    'community', 'health', 'human-rights', 'animals', 'disaster', 
    'tech', 'arts', 'religious', 'education', 'environment'
  ];

  const invalidInterests = interests.filter(interest => !validInterests.includes(interest));
  if (invalidInterests.length > 0) {
    return res.status(400).json({ 
      message: `Invalid interests: ${invalidInterests.join(', ')}`,
      validInterests 
    });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.id === payload.sub);
    
    if (userIndex < 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user interests and onboarding status
    users[userIndex] = {
      ...users[userIndex],
      interests: interests,
      hasCompletedOnboarding: true,
      interestsUpdatedAt: new Date().toISOString()
    };

    await writeUsers(users);

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
  const interests = [
    { id: 'community', title: 'Community Services', icon: 'heart', color: '#EF4444', iconType: 'ionicons' },
    { id: 'health', title: 'Health', icon: 'medical', color: '#10B981', iconType: 'ionicons' },
    { id: 'human-rights', title: 'Human Rights', icon: 'fist-raised', color: '#F97316', iconType: 'fontawesome5' },
    { id: 'animals', title: 'Animals', icon: 'paw', color: '#8B5CF6', iconType: 'fontawesome5' },
    { id: 'disaster', title: 'Disaster Relief', icon: 'ambulance', color: '#EF4444', iconType: 'fontawesome5' },
    { id: 'tech', title: 'Tech', icon: 'code', color: '#3B82F6', iconType: 'ionicons' },
    { id: 'arts', title: 'Arts & Culture', icon: 'palette', color: '#EC4899', iconType: 'ionicons' },
    { id: 'religious', title: 'Religious', icon: 'pray', color: '#F97316', iconType: 'fontawesome5' },
    { id: 'education', title: 'Education', icon: 'book-open', color: '#3B82F6', iconType: 'ionicons' },
    { id: 'environment', title: 'Environment', icon: 'leaf', color: '#10B981', iconType: 'ionicons' },
  ];

  res.json({ interests });
}

module.exports = {
  getUserInterests,
  updateUserInterests,
  getAvailableInterests
};

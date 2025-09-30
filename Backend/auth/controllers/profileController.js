const { findUserById, updateUser } = require('../../database/dataAccess');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../../config');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get user profile with extended information
async function getProfile(req, res) {
  try {
    const user = await findUserById(req.user.sub);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return extended user profile information
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        skills: user.skills || [],
        availability: user.availability || [],
        interests: user.interests || [],
        createdAt: user.createdAt,
        hasCompletedOnboarding: user.hasCompletedOnboarding
      }
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Update user profile
async function updateProfile(req, res) {
  try {
    const { name, bio, skills, availability, location, phone } = req.body;
    
    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      bio: bio ? bio.trim() : '',
      skills: Array.isArray(skills) ? skills.filter(skill => skill && skill.trim().length > 0) : [],
      availability: Array.isArray(availability) ? availability.filter(avail => avail && avail.trim().length > 0) : [],
      location: location ? location.trim() : '',
      phone: phone ? phone.trim() : '',
      profileUpdatedAt: new Date().toISOString()
    };

    // Update user in database
    const updatedUser = await updateUser(req.user.sub, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        location: updatedUser.location,
        bio: updatedUser.bio,
        skills: updatedUser.skills,
        availability: updatedUser.availability,
        interests: updatedUser.interests,
        profileUpdatedAt: updatedUser.profileUpdatedAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Update user interests (separate endpoint for interests management)
async function updateInterests(req, res) {
  console.log('=== UPDATE INTERESTS DEBUG ===');
  console.log('User ID from token:', req.user?.sub);
  console.log('Request body:', req.body);
  
  try {
    const { interests } = req.body;
    
    // Validate interests
    if (!Array.isArray(interests)) {
      return res.status(400).json({ message: 'Interests must be an array' });
    }

    // Prepare update data
    const updateData = {
      interests: interests.filter(interest => interest && interest.trim().length > 0),
      interestsUpdatedAt: new Date().toISOString()
    };

    // Update user interests in database
    console.log('Updating user with data:', updateData);
    const updatedUser = await updateUser(req.user.sub, updateData);
    console.log('Update result:', updatedUser);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Interests updated successfully',
      interests: updatedUser.interests
    });
  } catch (error) {
    console.error('❌ Update interests error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Upload avatar image
async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Get current user
    const user = await findUserById(req.user.sub);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old avatar if it exists
    if (user.avatar && user.avatar !== '') {
      const oldAvatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(user.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update user with new avatar path
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    const updateData = {
      avatar: avatarPath,
      profileUpdatedAt: new Date().toISOString()
    };

    const updatedUser = await updateUser(user.id, updateData);

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: avatarPath,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Delete avatar and reset to default
async function deleteAvatar(req, res) {
  try {
    // Get current user
    const user = await findUserById(req.user.sub);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the current avatar file if it exists and is not the default
    if (user.avatar && user.avatar !== '/uploads/avatars/default-avatar.png') {
      const avatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(user.avatar));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Reset to default avatar
    const updateData = {
      avatar: '/uploads/avatars/default-avatar.png',
      profileUpdatedAt: new Date().toISOString()
    };

    const updatedUser = await updateUser(user.id, updateData);

    res.json({
      message: 'Avatar deleted successfully',
      avatar: updatedUser.avatar,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  updateInterests,
  uploadAvatar,
  deleteAvatar,
  upload
};

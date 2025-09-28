const { readUsers, writeUsers, findUserById, updateUser } = require('../../database/dataAccess');
const jwt = require('jsonwebtoken');
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
      return res.status(401).json({ message: 'Invalid token' });
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
  } catch (e) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Update user profile
async function updateProfile(req, res) {
  console.log('=== PROFILE UPDATE DEBUG ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', req.headers);
  
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  
  if (!token) {
    console.log('ERROR: Missing token');
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    console.log('JWT payload:', payload);
    
    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.id === payload.sub);
    
    if (userIndex === -1) {
      console.log('ERROR: User not found for ID:', payload.sub);
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = users[userIndex];
    console.log('Current user:', { id: user.id, name: user.name, email: user.email });
    
    const { name, bio, skills, availability, location, phone } = req.body;
    console.log('Update data:', { name, bio, skills, availability, location, phone });

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Update user profile fields
    const updatedUser = {
      ...user,
      name: name.trim(),
      bio: bio ? bio.trim() : '',
      skills: Array.isArray(skills) ? skills.filter(skill => skill && skill.trim().length > 0) : [],
      availability: Array.isArray(availability) ? availability.filter(avail => avail && avail.trim().length > 0) : [],
      location: location ? location.trim() : '',
      phone: phone ? phone.trim() : '',
      profileUpdatedAt: new Date().toISOString()
    };

    // Update the user in the array
    users[userIndex] = updatedUser;
    
    // Save to file
    console.log('Saving updated user to file...');
    const saveResult = await writeUsers(users);
    console.log('Save result:', saveResult);

    console.log('Profile update successful!');
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
  } catch (e) {
    console.error('Update profile error:', e);
    console.error('Error stack:', e.stack);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Update user interests (separate endpoint for interests management)
async function updateInterests(req, res) {
  console.log('=== INTERESTS UPDATE DEBUG ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', req.headers);
  
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  
  if (!token) {
    console.log('ERROR: Missing token');
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    console.log('JWT payload:', payload);
    
    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.id === payload.sub);
    
    if (userIndex === -1) {
      console.log('ERROR: User not found for ID:', payload.sub);
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = users[userIndex];
    console.log('Current user:', { id: user.id, name: user.name, email: user.email });
    
    const { interests } = req.body;
    console.log('Interests data:', interests, 'Type:', typeof interests, 'Length:', interests?.length);

    // Validate interests
    if (!Array.isArray(interests)) {
      return res.status(400).json({ message: 'Interests must be an array' });
    }

    // Update user interests
    const updatedUser = {
      ...user,
      interests: interests.filter(interest => interest && interest.trim().length > 0),
      interestsUpdatedAt: new Date().toISOString()
    };

    console.log('Updated interests:', updatedUser.interests);
    console.log('Updated user:', { id: updatedUser.id, interests: updatedUser.interests });

    // Update the user in the array
    users[userIndex] = updatedUser;
    
    // Save to file
    console.log('Saving updated interests to file...');
    const saveResult = await writeUsers(users);
    console.log('Interests save result:', saveResult);

    console.log('Interests update successful!');
    res.json({
      message: 'Interests updated successfully',
      interests: updatedUser.interests
    });
  } catch (e) {
    console.error('Update interests error:', e);
    console.error('Error stack:', e.stack);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Upload avatar image
async function uploadAvatar(req, res) {
  console.log('=== UPLOAD AVATAR DEBUG ===');
  console.log('Request headers:', req.headers);
  console.log('Request file:', req.file);
  console.log('Request body:', req.body);
  
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  
  if (!token) {
    console.log('ERROR: Missing token');
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    console.log('JWT payload:', payload);
    
    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.id === payload.sub);
    
    if (userIndex === -1) {
      console.log('ERROR: User not found for ID:', payload.sub);
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (!req.file) {
      console.log('ERROR: No image file provided');
      return res.status(400).json({ message: 'No image file provided' });
    }

    console.log('File received:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    const user = users[userIndex];
    
    // Delete old avatar if it exists
    if (user.avatar && user.avatar !== '') {
      const oldAvatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(user.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update user with new avatar path
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    const updatedUser = {
      ...user,
      avatar: avatarPath,
      profileUpdatedAt: new Date().toISOString()
    };

    users[userIndex] = updatedUser;
    console.log('Saving updated user with new avatar...');
    const saveResult = await writeUsers(users);
    console.log('Avatar save result:', saveResult);

    console.log('Avatar upload successful!');
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
  } catch (e) {
    console.error('Upload avatar error:', e);
    console.error('Error stack:', e.stack);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Delete avatar and reset to default
async function deleteAvatar(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.id === payload.sub);
    
    if (userIndex === -1) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = users[userIndex];
    
    // Delete the current avatar file if it exists and is not the default
    if (user.avatar && user.avatar !== '/uploads/avatars/default-avatar.png') {
      const avatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(user.avatar));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Reset to default avatar
    const updatedUser = {
      ...user,
      avatar: '/uploads/avatars/default-avatar.png',
      profileUpdatedAt: new Date().toISOString()
    };

    users[userIndex] = updatedUser;
    await writeUsers(users);

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
  } catch (e) {
    console.error('Delete avatar error:', e);
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

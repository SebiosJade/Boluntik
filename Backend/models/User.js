const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['volunteer', 'organization', 'admin'],
    default: 'volunteer'
  },
  avatar: {
    type: String,
    default: '/uploads/avatars/default-avatar.png'
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  phone: {
    type: String,
    maxlength: 20,
    default: ''
  },
  location: {
    type: String,
    maxlength: 100,
    default: ''
  },
  skills: [{
    type: String,
    maxlength: 50
  }],
  availability: [{
    type: String,
    maxlength: 50
  }],
  interests: [{
    type: String,
    maxlength: 30
  }],
  hasCompletedOnboarding: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    bio: this.bio,
    phone: this.phone,
    location: this.location,
    skills: this.skills,
    availability: this.availability,
    interests: this.interests,
    hasCompletedOnboarding: this.hasCompletedOnboarding,
    emailVerified: this.emailVerified,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Method to verify password
userSchema.methods.verifyPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLoginAt = new Date();
  return await this.save();
};

// Pre-save middleware to update updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// Static method to find user by ID
userSchema.statics.findById = function(id) {
  return this.findOne({ id, isActive: true });
};

module.exports = mongoose.model('User', userSchema);

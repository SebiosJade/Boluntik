const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    length: 6
  },
  type: {
    type: String,
    enum: ['email_verification', 'password_reset'],
    default: 'email_verification'
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  isActive: {
    type: Boolean,
    default: true
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

// Indexes for better query performance
emailVerificationSchema.index({ email: 1 });
emailVerificationSchema.index({ code: 1 });
emailVerificationSchema.index({ type: 1 });
emailVerificationSchema.index({ verified: 1 });
emailVerificationSchema.index({ isActive: 1 });

// Virtual for verification details
emailVerificationSchema.virtual('verificationDetails').get(function() {
  return {
    id: this.id,
    email: this.email,
    type: this.type,
    verified: this.verified,
    verifiedAt: this.verifiedAt,
    expiresAt: this.expiresAt,
    attempts: this.attempts,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Method to verify the code
emailVerificationSchema.methods.verify = async function() {
  this.verified = true;
  this.verifiedAt = new Date();
  return await this.save();
};

// Method to increment attempts
emailVerificationSchema.methods.incrementAttempts = async function() {
  this.attempts += 1;
  return await this.save();
};

// Method to check if verification is valid
emailVerificationSchema.methods.isValid = function() {
  return this.verified && 
         this.isActive && 
         new Date() < this.expiresAt && 
         this.attempts < 5;
};

// Method to check if verification is expired
emailVerificationSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Static method to find valid verification
emailVerificationSchema.statics.findValidVerification = function(email, code, type = 'email_verification') {
  return this.findOne({
    email: email.toLowerCase(),
    code,
    type,
    verified: true,
    isActive: true,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: 5 }
  });
};

// Static method to find pending verification
emailVerificationSchema.statics.findPendingVerification = function(email, type = 'email_verification') {
  return this.findOne({
    email: email.toLowerCase(),
    type,
    verified: false,
    isActive: true,
    expiresAt: { $gt: new Date() }
  });
};

// Static method to clean up expired verifications
emailVerificationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Static method to deactivate old verifications for email
emailVerificationSchema.statics.deactivateOldVerifications = function(email, type = 'email_verification') {
  return this.updateMany(
    { email: email.toLowerCase(), type, isActive: true },
    { isActive: false }
  );
};

// Pre-save middleware to update updatedAt
emailVerificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);

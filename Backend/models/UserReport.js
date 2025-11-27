const mongoose = require('mongoose');

const userReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  reporterId: {
    type: String,
    required: true,
    index: true
  },
  reporterName: {
    type: String,
    required: true
  },
  reporterEmail: {
    type: String,
    required: true
  },
  reporterRole: {
    type: String,
    enum: ['volunteer', 'organization', 'admin'],
    required: true
  },
  reportedUserId: {
    type: String,
    required: true,
    index: true
  },
  reportedUserName: {
    type: String,
    required: true
  },
  reportedUserEmail: {
    type: String,
    required: true
  },
  reportedUserRole: {
    type: String,
    enum: ['volunteer', 'organization', 'admin'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'harassment',
      'spam',
      'inappropriate_behavior',
      'fake_profile',
      'scam',
      'offensive_content',
      'impersonation',
      'other'
    ]
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  evidence: [{
    type: {
      type: String,
      enum: ['screenshot', 'link', 'text'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  adminReview: {
    reviewedBy: {
      adminId: String,
      adminName: String
    },
    reviewedAt: Date,
    decision: {
      type: String,
      enum: ['valid', 'invalid', 'needs_more_info']
    },
    actionTaken: {
      type: String,
      enum: ['user_suspended', 'user_warned', 'no_action', 'account_deleted']
    },
    adminNotes: String
  },
  resolution: {
    resolvedAt: Date,
    outcome: String,
    notificationsSent: {
      type: Boolean,
      default: false
    }
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
  timestamps: true
});

// Indexes for efficient queries
userReportSchema.index({ status: 1, priority: -1 });
userReportSchema.index({ reportedUserId: 1, status: 1 });
userReportSchema.index({ reporterId: 1 });
userReportSchema.index({ createdAt: -1 });

// Pre-save middleware
userReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const UserReport = mongoose.model('UserReport', userReportSchema);

module.exports = UserReport;


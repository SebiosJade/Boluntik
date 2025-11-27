const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const donationSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
  },
  donorName: {
    type: String,
    required: true,
  },
  donorEmail: {
    type: String,
  },
  donorUserId: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  referenceNumber: {
    type: String,
    required: true,
  },
  screenshotUrl: {
    type: String,
    required: true,
  },
  message: {
    type: String,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  verifiedBy: {
    type: String,
  },
  verifiedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

const campaignSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
  },
  organizationId: {
    type: String,
    required: true,
  },
  organizationName: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Education', 'Healthcare', 'Environment', 'Community', 'Emergency', 'Technology', 'Others'],
  },
  goalAmount: {
    type: Number,
    required: true,
    min: 1,
  },
  currentAmount: {
    type: Number,
    default: 0,
  },
  imageUrl: {
    type: String,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'disbursed'],
    default: 'active',
  },
  completedAt: {
    type: Date,
  },
  donations: [donationSchema],
  disbursementDetails: {
    platformFee: Number,
    netAmount: Number,
    disbursedAt: Date,
    disbursedBy: String,
    notes: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update currentAmount based on verified donations
campaignSchema.methods.updateCurrentAmount = function() {
  this.currentAmount = this.donations
    .filter(d => d.status === 'verified')
    .reduce((sum, d) => sum + d.amount, 0);
};

// Check if campaign is expired
campaignSchema.methods.isExpired = function() {
  return new Date() > this.dueDate;
};

// Get verified donations count
campaignSchema.methods.getVerifiedDonationsCount = function() {
  return this.donations.filter(d => d.status === 'verified').length;
};

// Calculate disbursement
campaignSchema.methods.calculateDisbursement = function(platformFeePercentage) {
  const platformFee = (this.currentAmount * platformFeePercentage) / 100;
  const netAmount = this.currentAmount - platformFee;
  return { platformFee, netAmount };
};

// Mark campaign as completed if expired
campaignSchema.methods.markCompletedIfExpired = function() {
  if (this.isExpired() && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
    this.updatedAt = new Date();
    return true; // Campaign was marked as completed
  }
  return false; // Campaign was not changed
};

// Static method to complete all expired campaigns
campaignSchema.statics.completeExpiredCampaigns = async function() {
  const now = new Date();
  const expiredCampaigns = await this.find({
    status: 'active',
    dueDate: { $lt: now }
  });

  const completedCampaigns = [];
  
  for (const campaign of expiredCampaigns) {
    campaign.status = 'completed';
    campaign.completedAt = now;
    campaign.updatedAt = now;
    await campaign.save();
    completedCampaigns.push(campaign);
  }

  return completedCampaigns;
};

module.exports = mongoose.model('Campaign', campaignSchema);


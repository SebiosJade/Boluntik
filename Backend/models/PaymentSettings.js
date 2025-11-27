const mongoose = require('mongoose');

const paymentSettingsSchema = new mongoose.Schema({
  qrCodeUrl: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['gcash', 'bank'],
    required: true,
  },
  accountName: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  platformFeePercentage: {
    type: Number,
    default: 5,
    min: 0,
    max: 100,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: String,
    required: true,
  },
});

// Ensure only one settings document exists
paymentSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    // Return default settings if none exist
    return null;
  }
  return settings;
};

paymentSettingsSchema.statics.updateSettings = async function(data) {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this(data);
  } else {
    Object.assign(settings, data);
  }
  settings.updatedAt = Date.now();
  await settings.save();
  return settings;
};

module.exports = mongoose.model('PaymentSettings', paymentSettingsSchema);


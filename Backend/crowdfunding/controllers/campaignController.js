const Campaign = require('../../models/Campaign');
const PaymentSettings = require('../../models/PaymentSettings');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');
const logger = require('../../utils/logger');
const notificationController = require('../../notifications/controllers/notificationController');

// Get all campaigns (public)
exports.getAllCampaigns = catchAsync(async (req, res, next) => {
  const { status, category } = req.query;
  
  const filter = {};
  if (status) filter.status = status;
  if (category && category !== 'All') filter.category = category;

  const campaigns = await Campaign.find(filter).sort('-createdAt');
  
  res.status(200).json({
    status: 'success',
    results: campaigns.length,
    data: { campaigns },
  });
});

// Get single campaign (public)
exports.getCampaign = catchAsync(async (req, res, next) => {
  const campaign = await Campaign.findOne({ id: req.params.id });
  
  if (!campaign) {
    return next(new AppError('Campaign not found', 404));
  }

  // Get payment settings for QR code
  const paymentSettings = await PaymentSettings.getSettings();

  res.status(200).json({
    status: 'success',
    data: { campaign, paymentSettings },
  });
});

// Get organization's campaigns
exports.getOrgCampaigns = catchAsync(async (req, res, next) => {
  const organizationId = req.user.id;
  
  const campaigns = await Campaign.find({ organizationId }).sort('-createdAt');
  
  res.status(200).json({
    status: 'success',
    results: campaigns.length,
    data: { campaigns },
  });
});

// Create campaign (organization only)
exports.createCampaign = catchAsync(async (req, res, next) => {
  const { title, description, category, goalAmount, dueDate, imageUrl } = req.body;
  const organizationId = req.user.id;
  const organizationName = req.user.organizationName || req.user.name;

  // Validate payment settings exist
  const paymentSettings = await PaymentSettings.getSettings();
  if (!paymentSettings) {
    return next(new AppError('Payment settings not configured. Please contact administrator.', 400));
  }

  if (!title || !description || !category || !goalAmount || !dueDate) {
    return next(new AppError('All fields are required', 400));
  }

  const campaign = await Campaign.create({
    organizationId,
    organizationName,
    title,
    description,
    category,
    goalAmount,
    dueDate,
    imageUrl,
  });

  logger.info(`New campaign created - Title: ${title}, Organization: ${organizationName}, Goal: ${goalAmount}`);

  // Notify all admins about new campaign
  try {
    const User = require('../../models/User');
    const admins = await User.find({ role: 'admin', isActive: true });
    
    await Promise.all(
      admins.map(admin => 
        notificationController.createCampaignNotification(
          admin.id,
          title,
          organizationName,
          goalAmount,
          {
            campaignId: campaign.id,
            category,
          }
        )
      )
    );
    logger.info(`${admins.length} admin(s) notified about new campaign`);
  } catch (error) {
    logger.error('Error notifying admins about campaign:', error);
  }

  // Notify all volunteers about new campaign
  try {
    const User = require('../../models/User');
    const volunteers = await User.find({ role: 'volunteer', isActive: true });
    
    await Promise.all(
      volunteers.map(volunteer => 
        notificationController.createCampaignNotification(
          volunteer.id,
          title,
          organizationName,
          goalAmount,
          {
            campaignId: campaign.id,
            category,
          }
        )
      )
    );
    logger.info(`${volunteers.length} volunteer(s) notified about new campaign`);
  } catch (error) {
    logger.error('Error notifying volunteers about campaign:', error);
  }

  res.status(201).json({
    status: 'success',
    message: 'Campaign created successfully',
    data: { campaign },
  });
});

// Update campaign (organization only)
exports.updateCampaign = catchAsync(async (req, res, next) => {
  const campaign = await Campaign.findOne({ id: req.params.id });
  
  if (!campaign) {
    return next(new AppError('Campaign not found', 404));
  }

  // Check ownership
  if (campaign.organizationId !== req.user.id) {
    return next(new AppError('You do not have permission to update this campaign', 403));
  }

  // Cannot update disbursed campaigns
  if (campaign.status === 'disbursed') {
    return next(new AppError('Cannot update disbursed campaign', 400));
  }

  const { title, description, category, goalAmount, dueDate, imageUrl, status } = req.body;
  
  if (title) campaign.title = title;
  if (description) campaign.description = description;
  if (category) campaign.category = category;
  if (goalAmount) campaign.goalAmount = goalAmount;
  if (dueDate) campaign.dueDate = dueDate;
  if (imageUrl) campaign.imageUrl = imageUrl;
  if (status) campaign.status = status;
  
  campaign.updatedAt = Date.now();
  await campaign.save();

  res.status(200).json({
    status: 'success',
    message: 'Campaign updated successfully',
    data: { campaign },
  });
});

// Delete campaign (organization only)
exports.deleteCampaign = catchAsync(async (req, res, next) => {
  const campaign = await Campaign.findOne({ id: req.params.id });
  
  if (!campaign) {
    return next(new AppError('Campaign not found', 404));
  }

  // Check ownership
  if (campaign.organizationId !== req.user.id) {
    return next(new AppError('You do not have permission to delete this campaign', 403));
  }

  // Cannot delete if there are verified donations
  const verifiedDonations = campaign.donations.filter(d => d.status === 'verified');
  if (verifiedDonations.length > 0) {
    return next(new AppError('Cannot delete campaign with verified donations', 400));
  }

  await Campaign.deleteOne({ id: req.params.id });

  res.status(200).json({
    status: 'success',
    message: 'Campaign deleted successfully',
  });
});

// Submit donation (public - but can be authenticated)
exports.submitDonation = catchAsync(async (req, res, next) => {
  const { donorName, donorEmail, amount, referenceNumber, screenshotUrl, message, isAnonymous } = req.body;
  const campaignId = req.params.id;
  
  // Get user ID if authenticated (optional - donations can be anonymous from non-users)
  const donorUserId = req.user ? req.user.id : null;

  if (!donorName || !amount || !referenceNumber || !screenshotUrl) {
    return next(new AppError('Donor name, amount, reference number, and screenshot are required', 400));
  }

  const campaign = await Campaign.findOne({ id: campaignId });
  
  if (!campaign) {
    return next(new AppError('Campaign not found', 404));
  }

  if (campaign.status !== 'active') {
    return next(new AppError('This campaign is not accepting donations', 400));
  }

  if (campaign.isExpired()) {
    return next(new AppError('This campaign has ended', 400));
  }

  campaign.donations.push({
    donorName,
    donorEmail,
    donorUserId, // Store the user ID if they're logged in
    amount: parseFloat(amount),
    referenceNumber,
    screenshotUrl,
    message,
    isAnonymous: isAnonymous || false,
  });

  await campaign.save();

  // Get the newly added donation
  const newDonation = campaign.donations[campaign.donations.length - 1];

  logger.info(`New donation submitted - Campaign: ${campaign.title}, Donor: ${donorName}, Amount: ${amount}`);

  // Notify organization owner about new donation
  try {
    await notificationController.createNewDonationNotification(
      campaign.organizationId,
      donorName,
      campaign.title,
      parseFloat(amount),
      {
        campaignId: campaign.id,
        donationId: newDonation.id,
        referenceNumber,
      }
    );
    logger.info(`Organization notified about new donation - OrgId: ${campaign.organizationId}`);
  } catch (error) {
    logger.error('Error notifying organization:', error);
  }

  // Notify all admins about new donation
  try {
    const User = require('../../models/User');
    const admins = await User.find({ role: 'admin', isActive: true });
    
    await Promise.all(
      admins.map(admin => 
        notificationController.createNewDonationNotification(
          admin.id,
          donorName,
          campaign.title,
          parseFloat(amount),
          {
            campaignId: campaign.id,
            donationId: newDonation.id,
            referenceNumber,
          }
        )
      )
    );
    logger.info(`${admins.length} admin(s) notified about new donation`);
  } catch (error) {
    logger.error('Error notifying admins:', error);
  }

  res.status(201).json({
    status: 'success',
    message: 'Donation submitted successfully. Pending verification.',
    data: { campaign },
  });
});

// Get user's donation history (authenticated user)
exports.getMyDonations = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const userEmail = req.user.email;
  
  const campaigns = await Campaign.find();
  
  let myDonations = [];
  campaigns.forEach(campaign => {
    campaign.donations.forEach(donation => {
      // Match by user ID or email
      if (donation.donorUserId === userId || donation.donorEmail === userEmail) {
        myDonations.push({
          ...donation.toObject(),
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          organizationName: campaign.organizationName,
          campaignStatus: campaign.status,
          campaignDueDate: campaign.dueDate,
        });
      }
    });
  });

  // Sort by submission date (newest first)
  myDonations.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  res.status(200).json({
    status: 'success',
    results: myDonations.length,
    data: { donations: myDonations },
  });
});

// Get all donations (admin only)
exports.getAllDonations = catchAsync(async (req, res, next) => {
  const { status } = req.query;
  
  const campaigns = await Campaign.find();
  
  let allDonations = [];
  campaigns.forEach(campaign => {
    campaign.donations.forEach(donation => {
      allDonations.push({
        ...donation.toObject(),
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        organizationName: campaign.organizationName,
      });
    });
  });

  // Filter by status if provided
  if (status) {
    allDonations = allDonations.filter(d => d.status === status);
  }

  // Sort by submission date (newest first)
  allDonations.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  res.status(200).json({
    status: 'success',
    results: allDonations.length,
    data: { donations: allDonations },
  });
});

// Verify donation (admin only)
exports.verifyDonation = catchAsync(async (req, res, next) => {
  const { campaignId, donationId } = req.params;
  const { status, rejectionReason } = req.body;
  const adminId = req.user.id;

  if (!['verified', 'rejected'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const campaign = await Campaign.findOne({ id: campaignId });
  
  if (!campaign) {
    return next(new AppError('Campaign not found', 404));
  }

  const donation = campaign.donations.find(d => d.id === donationId);
  
  if (!donation) {
    return next(new AppError('Donation not found', 404));
  }

  if (donation.status !== 'pending') {
    return next(new AppError('Donation already processed', 400));
  }

  donation.status = status;
  donation.verifiedBy = adminId;
  donation.verifiedAt = Date.now();
  
  if (status === 'rejected' && rejectionReason) {
    donation.rejectionReason = rejectionReason;
  }

  // Update campaign current amount
  campaign.updateCurrentAmount();
  campaign.updatedAt = Date.now();
  
  await campaign.save();

  // Create notification for the donor
  try {
    let donorUserId = donation.donorUserId;
    
    // If no user ID stored, try to find user by email
    if (!donorUserId && donation.donorEmail) {
      const User = require('../../models/User');
      const donorUser = await User.findOne({ email: donation.donorEmail });
      donorUserId = donorUser ? donorUser.id : null;
    }
    
    // Create notification if we have a user ID
    if (donorUserId) {
      const notification = await notificationController.createDonationNotification(
        donorUserId,
        status === 'verified' ? 'donation_verified' : 'donation_rejected',
        campaign.title,
        donation.amount,
        {
          campaignId: campaign.id,
          donationId: donation.id,
          referenceNumber: donation.referenceNumber,
        }
      );
      logger.info(`Notification created for donor: ${donorUserId}`);
    } else {
      logger.warn(`Cannot create notification - no user ID for donation ${donation.id}`);
    }
  } catch (notificationError) {
    logger.error('Error creating donation notification:', notificationError);
  }

  logger.info(`Donation ${status} - Campaign: ${campaign.title}, Donor: ${donation.donorName}, Amount: ${donation.amount}`);

  res.status(200).json({
    status: 'success',
    message: `Donation ${status} successfully`,
    data: { campaign },
  });
});

// Disburse funds (admin only)
exports.disburseFunds = catchAsync(async (req, res, next) => {
  const { campaignId } = req.params;
  const { notes } = req.body;
  const adminId = req.user.id;

  const campaign = await Campaign.findOne({ id: campaignId });
  
  if (!campaign) {
    return next(new AppError('Campaign not found', 404));
  }

  if (campaign.status === 'disbursed') {
    return next(new AppError('Funds already disbursed', 400));
  }

  if (campaign.currentAmount === 0) {
    return next(new AppError('No funds to disburse', 400));
  }

  const paymentSettings = await PaymentSettings.getSettings();
  const { platformFee, netAmount } = campaign.calculateDisbursement(paymentSettings.platformFeePercentage);

  campaign.status = 'disbursed';
  campaign.disbursementDetails = {
    platformFee,
    netAmount,
    disbursedAt: Date.now(),
    disbursedBy: adminId,
    notes,
  };
  campaign.updatedAt = Date.now();

  await campaign.save();

  logger.info(`Funds disbursed - Campaign: ${campaign.title}, Net Amount: ${netAmount}, Platform Fee: ${platformFee}`);

  res.status(200).json({
    status: 'success',
    message: 'Funds disbursed successfully',
    data: { campaign },
  });
});

// Complete expired campaigns (admin only)
exports.completeExpiredCampaigns = catchAsync(async (req, res, next) => {
  const completedCampaigns = await Campaign.completeExpiredCampaigns();
  
  logger.info(`Completed ${completedCampaigns.length} expired campaigns`);
  
  // Notify organizations about completed campaigns
  for (const campaign of completedCampaigns) {
    try {
      await notificationController.createCampaignCompletedNotification(
        campaign.organizationId,
        campaign.title,
        campaign.currentAmount,
        campaign.goalAmount,
        {
          campaignId: campaign.id,
          completedAt: campaign.completedAt,
        }
      );
    } catch (error) {
      logger.error(`Error notifying organization about completed campaign ${campaign.id}:`, error);
    }
  }

  res.status(200).json({
    status: 'success',
    message: `${completedCampaigns.length} expired campaigns completed`,
    data: { 
      completedCount: completedCampaigns.length,
      campaigns: completedCampaigns.map(c => ({
        id: c.id,
        title: c.title,
        organizationName: c.organizationName,
        completedAt: c.completedAt,
        currentAmount: c.currentAmount,
        goalAmount: c.goalAmount
      }))
    },
  });
});


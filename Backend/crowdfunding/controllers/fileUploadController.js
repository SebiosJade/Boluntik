const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../../utils/appError');

// Ensure upload directories exist
const uploadDirs = {
  qr: 'uploads/crowdfunding/qr-codes',
  campaigns: 'uploads/crowdfunding/campaigns',
  donations: 'uploads/crowdfunding/donations',
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage for QR codes
const qrStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.qr);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-');
    cb(null, 'qr-' + uniqueSuffix + path.extname(sanitizedName));
  },
});

// Storage for campaign images
const campaignStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.campaigns);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-');
    cb(null, 'campaign-' + uniqueSuffix + path.extname(sanitizedName));
  },
});

// Storage for donation screenshots
const donationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirs.donations);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-');
    cb(null, 'donation-' + uniqueSuffix + path.extname(sanitizedName));
  },
});

// File filter for images only
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed', 400), false);
  }
};

// Multer instances
const uploadQR = multer({
  storage: qrStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadCampaignImage = multer({
  storage: campaignStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadDonationScreenshot = multer({
  storage: donationStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Controllers
exports.uploadQRCode = uploadQR.single('qrCode');

exports.uploadCampaignImage = uploadCampaignImage.single('campaignImage');

exports.uploadDonationScreenshot = uploadDonationScreenshot.single('screenshot');

exports.handleQRUpload = (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }

  const fileUrl = `/${uploadDirs.qr}/${req.file.filename}`;
  
  res.status(200).json({
    status: 'success',
    data: {
      fileUrl,
      fileName: req.file.filename,
    },
  });
};

exports.handleCampaignImageUpload = (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }

  const fileUrl = `/${uploadDirs.campaigns}/${req.file.filename}`;
  
  res.status(200).json({
    status: 'success',
    data: {
      fileUrl,
      fileName: req.file.filename,
    },
  });
};

exports.handleDonationScreenshotUpload = (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }

  const fileUrl = `/${uploadDirs.donations}/${req.file.filename}`;
  
  res.status(200).json({
    status: 'success',
    data: {
      fileUrl,
      fileName: req.file.filename,
    },
  });
};


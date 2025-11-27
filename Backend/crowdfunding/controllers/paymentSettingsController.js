const PaymentSettings = require('../../models/PaymentSettings');
const AppError = require('../../utils/appError');
const catchAsync = require('../../utils/catchAsync');

exports.getSettings = catchAsync(async (req, res, next) => {
  const settings = await PaymentSettings.getSettings();
  
  res.status(200).json({
    status: 'success',
    data: { settings },
  });
});

exports.updateSettings = catchAsync(async (req, res, next) => {
  const { qrCodeUrl, paymentMethod, accountName, accountNumber, platformFeePercentage } = req.body;
  const userId = req.user.id;

  if (!qrCodeUrl || !paymentMethod || !accountName || !accountNumber) {
    return next(new AppError('All fields are required', 400));
  }

  const settings = await PaymentSettings.updateSettings({
    qrCodeUrl,
    paymentMethod,
    accountName,
    accountNumber,
    platformFeePercentage: platformFeePercentage || 5,
    updatedBy: userId,
  });

  res.status(200).json({
    status: 'success',
    message: 'Payment settings updated successfully',
    data: { settings },
  });
});


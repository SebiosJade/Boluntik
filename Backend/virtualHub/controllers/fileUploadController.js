const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger');

// Configure multer for task file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/task-files');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Decode URL-encoded characters and sanitize filename
    const decodedName = decodeURIComponent(file.originalname);
    const ext = path.extname(decodedName);
    const nameWithoutExt = path.basename(decodedName, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with dash
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .substring(0, 50); // Limit length
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept all file types for task attachments
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload task files
exports.uploadTaskFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      fileName: file.originalname,
      fileUrl: `/uploads/task-files/${file.filename}`,
      fileSize: file.size,
      fileType: file.mimetype
    }));

    logger.info(`Uploaded ${uploadedFiles.length} task files`);

    res.json({ 
      message: 'Files uploaded successfully',
      files: uploadedFiles 
    });
  } catch (error) {
    logger.error('Error uploading task files:', error);
    res.status(500).json({ message: 'Failed to upload files' });
  }
};

exports.upload = upload;


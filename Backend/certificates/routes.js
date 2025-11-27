const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { awardCertificates, getVolunteerCertificates, getOrganizationCertificates, generateCertificate, verifyCertificate, uploadCertificatePDF } = require('./controllers/certificateController');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/certificates/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'certificate-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Allow PDF and image files
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Award certificates to volunteers (requires authentication)
router.post('/award', authenticateToken, awardCertificates);

// Get certificates for a specific volunteer (requires authentication)
router.get('/volunteer/:volunteerId', authenticateToken, getVolunteerCertificates);

// Get all certificates awarded by an organization (requires authentication)
router.get('/organization/:organizationId', authenticateToken, getOrganizationCertificates);

// Generate certificate preview/download data (requires authentication)
router.get('/generate/:volunteerId/:certificateId', authenticateToken, generateCertificate);

// Verify certificate authenticity (public endpoint)
router.get('/verify/:certificateId', verifyCertificate);

// Upload certificate PDF (requires authentication)
router.post('/upload-pdf', authenticateToken, upload.single('file'), uploadCertificatePDF);

module.exports = router;

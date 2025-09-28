const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Authentication validations
const signupValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('Name can contain letters, spaces, hyphens, apostrophes, and periods'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['volunteer', 'organization', 'admin'])
    .withMessage('Role must be volunteer, organization, or admin'),
  
  body('verificationCode')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .isNumeric()
    .withMessage('Verification code must contain only numbers'),
  
  handleValidationErrors
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

const emailVerificationValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
    .isNumeric()
    .withMessage('Verification code must contain only numbers'),
  
  handleValidationErrors
];

const passwordResetValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('Reset code must be 6 digits')
    .isNumeric()
    .withMessage('Reset code must contain only numbers'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  handleValidationErrors
];

const profileUpdateValidation = [
  body('name')
    .optional()
    .custom((value) => {
      if (!value || value.trim().length === 0) {
        return true; // Allow empty values
      }
      const trimmed = value.trim();
      if (trimmed.length < 2 || trimmed.length > 50) {
        throw new Error('Name must be between 2 and 50 characters');
      }
      if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmed)) {
        throw new Error('Name can only contain letters, spaces, hyphens, apostrophes, and periods');
      }
      return true;
    }),
  
  body('bio')
    .optional()
    .custom((value) => {
      if (!value || value.trim().length === 0) {
        return true; // Allow empty values
      }
      if (value.trim().length > 500) {
        throw new Error('Bio must be less than 500 characters');
      }
      return true;
    }),
  
  body('phone')
    .optional()
    .custom((value) => {
      if (!value || value.trim().length === 0) {
        return true; // Allow empty values
      }
      // More flexible phone validation - allows common formats
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/;
      if (!phoneRegex.test(value.trim())) {
        throw new Error('Please provide a valid phone number (7-20 digits, may include spaces, hyphens, parentheses)');
      }
      return true;
    }),
  
  body('location')
    .optional()
    .custom((value) => {
      if (!value || value.trim().length === 0) {
        return true; // Allow empty values
      }
      if (value.trim().length > 100) {
        throw new Error('Location must be less than 100 characters');
      }
      return true;
    }),
  
  body('skills')
    .optional()
    .custom((skills) => {
      if (!skills) {
        return true; // Allow undefined/null
      }
      if (!Array.isArray(skills)) {
        throw new Error('Skills must be an array');
      }
      if (skills.length === 0) {
        return true; // Allow empty arrays
      }
      if (skills.length > 10) {
        throw new Error('Maximum 10 skills allowed');
      }
      for (const skill of skills) {
        if (typeof skill !== 'string' || skill.trim().length === 0) {
          throw new Error('Each skill must be a non-empty string');
        }
        if (skill.length > 50) {
          throw new Error('Each skill must be less than 50 characters');
        }
      }
      return true;
    }),
  
  body('availability')
    .optional()
    .custom((availability) => {
      if (!availability) {
        return true; // Allow undefined/null
      }
      if (!Array.isArray(availability)) {
        throw new Error('Availability must be an array');
      }
      if (availability.length === 0) {
        return true; // Allow empty arrays
      }
      if (availability.length > 5) {
        throw new Error('Maximum 5 availability options allowed');
      }
      for (const option of availability) {
        if (typeof option !== 'string' || option.trim().length === 0) {
          throw new Error('Each availability option must be a non-empty string');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

const interestsValidation = [
  body('interests')
    .custom((interests) => {
      if (!interests) {
        return true; // Allow undefined/null
      }
      if (!Array.isArray(interests)) {
        throw new Error('Interests must be an array');
      }
      if (interests.length === 0) {
        return true; // Allow empty arrays
      }
      if (interests.length > 15) {
        throw new Error('Maximum 15 interests allowed');
      }
      for (const interest of interests) {
        if (typeof interest !== 'string' || interest.trim().length === 0) {
          throw new Error('Each interest must be a non-empty string');
        }
        if (interest.length > 30) {
          throw new Error('Each interest must be less than 30 characters');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

// Password change validation
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  
  handleValidationErrors
];

// Delete account validation (no body validation needed, just authentication)
const deleteAccountValidation = [
  // No body validation needed - just requires authentication
  handleValidationErrors
];

// Event validations
const eventValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  body('date')
    .matches(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/)
    .withMessage('Date must be in MM/DD/YYYY format'),
  
  body('time')
    .matches(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i)
    .withMessage('Time must be in HH:MM AM/PM format'),
  
  body('endTime')
    .optional()
    .matches(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i)
    .withMessage('End time must be in HH:MM AM/PM format'),
  
  body('location')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Location must be between 3 and 200 characters'),
  
  body('maxParticipants')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max participants must be between 1 and 1000'),
  
  body('eventType')
    .optional()
    .custom((value) => {
      if (!value) return true; // Allow empty values since it's optional
      const validTypes = [
        'volunteer', 'workshop', 'training', 'conference', 'fundraiser', 
        'community service', 'educational', 'recreational', 'professional development', 'other'
      ];
      const lowerValue = value.toLowerCase();
      if (!validTypes.includes(lowerValue)) {
        throw new Error('Event type must be one of: volunteer, workshop, training, conference, fundraiser, community service, educational, recreational, professional development, or other');
      }
      return true;
    }),
  
  body('difficulty')
    .optional()
    .custom((value) => {
      if (!value) return true; // Allow empty values since it's optional
      const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert', 'all levels'];
      const lowerValue = value.toLowerCase();
      if (!validDifficulties.includes(lowerValue)) {
        throw new Error('Difficulty must be beginner, intermediate, advanced, expert, or all levels');
      }
      return true;
    }),
  
  body('cause')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Cause must be less than 100 characters'),
  
  body('skills')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Skills must be less than 200 characters'),
  
  body('ageRestriction')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Age restriction must be less than 50 characters'),
  
  body('equipment')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Equipment must be less than 200 characters'),
  
  handleValidationErrors
];

const eventIdValidation = [
  param('id')
    .optional()
    .isUUID()
    .withMessage('Event ID must be a valid UUID'),
  
  param('eventId')
    .optional()
    .isUUID()
    .withMessage('Event ID must be a valid UUID'),
  
  // Custom validation to ensure at least one of id or eventId is provided and valid
  (req, res, next) => {
    const { id, eventId } = req.params;
    if (!id && !eventId) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [{ field: 'id', message: 'Event ID is required' }]
      });
    }
    if (id && !require('uuid').validate(id)) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [{ field: 'id', message: 'Event ID must be a valid UUID' }]
      });
    }
    if (eventId && !require('uuid').validate(eventId)) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [{ field: 'eventId', message: 'Event ID must be a valid UUID' }]
      });
    }
    next();
  }
];

const userIdValidation = [
  param('userId')
    .isLength({ min: 1 })
    .withMessage('User ID is required')
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('User ID must contain only alphanumeric characters and hyphens'),
  
  handleValidationErrors
];

const organizationIdValidation = [
  param('organizationId')
    .isLength({ min: 1 })
    .withMessage('Organization ID is required')
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Organization ID must contain only alphanumeric characters and hyphens'),
  
  handleValidationErrors
];

// Removed duplicate exports - see end of file

// Event update validation (more flexible for partial updates)
const eventUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  body('date')
    .optional()
    .matches(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/)
    .withMessage('Date must be in MM/DD/YYYY format'),
  
  body('time')
    .optional()
    .matches(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i)
    .withMessage('Time must be in HH:MM AM/PM format'),
  
  body('endTime')
    .optional()
    .matches(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i)
    .withMessage('End time must be in HH:MM AM/PM format'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Location must be between 3 and 200 characters'),
  
  body('maxParticipants')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 1 || numValue > 1000) {
        throw new Error('Max participants must be between 1 and 1000');
      }
      return true;
    }),
  
  body('eventType')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const validTypes = [
        'volunteer', 'workshop', 'training', 'conference', 'fundraiser', 
        'community service', 'educational', 'recreational', 'professional development', 'other',
        'Volunteer', 'Workshop', 'Training', 'Conference', 'Fundraiser', 
        'Community Service', 'Educational', 'Recreational', 'Professional Development', 'Other'
      ];
      if (!validTypes.includes(value)) {
        throw new Error('Event type must be one of: volunteer, workshop, training, conference, fundraiser, community service, educational, recreational, professional development, or other');
      }
      return true;
    }),
  
  body('difficulty')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const validDifficulties = [
        'beginner', 'intermediate', 'advanced', 'expert', 'all levels',
        'Beginner', 'Intermediate', 'Advanced', 'Expert', 'All Levels'
      ];
      if (!validDifficulties.includes(value)) {
        throw new Error('Difficulty must be beginner, intermediate, advanced, expert, or all levels');
      }
      return true;
    }),
  
  body('cause')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Cause must be less than 100 characters'),
  
  body('skills')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Skills must be less than 200 characters'),
  
  body('ageRestriction')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Age restriction must be less than 50 characters'),
  
  body('equipment')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Equipment must be less than 200 characters'),
  
  body('status')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const validStatuses = [
        'upcoming', 'ongoing', 'completed', 'cancelled',
        'Upcoming', 'Ongoing', 'Completed', 'Cancelled'
      ];
      if (!validStatuses.includes(value)) {
        throw new Error('Status must be upcoming, ongoing, completed, or cancelled');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Logout validation (just checks for valid JWT token)
const logoutValidation = [
  // No body validation needed for logout - just need valid JWT token
  handleValidationErrors
];

module.exports = {
  signupValidation,
  loginValidation,
  emailVerificationValidation,
  passwordResetValidation,
  changePasswordValidation,
  deleteAccountValidation,
  interestsValidation,
  profileUpdateValidation,
  eventValidation,
  eventUpdateValidation,
  logoutValidation,
  eventIdValidation,
  userIdValidation,
  organizationIdValidation,
  handleValidationErrors
};

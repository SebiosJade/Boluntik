import { FormErrors, ValidationResult } from '../types';

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email.trim());
  
  return {
    isValid,
    errors: isValid ? [] : ['Please enter a valid email address']
  };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Confirm password validation
export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationResult => {
  const isValid = password === confirmPassword;
  
  return {
    isValid,
    errors: isValid ? [] : ['Passwords do not match']
  };
};

// Name validation
export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!name.trim()) {
    errors.push('Name is required');
  } else if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Phone validation (optional)
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone.trim()) {
    return { isValid: true, errors: [] }; // Optional field
  }
  
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const isValid = phoneRegex.test(phone.replace(/\s/g, ''));
  
  return {
    isValid,
    errors: isValid ? [] : ['Please enter a valid phone number']
  };
};

// Reset code validation
export const validateResetCode = (code: string): ValidationResult => {
  const isValid = /^\d{6}$/.test(code);
  
  return {
    isValid,
    errors: isValid ? [] : ['Please enter a valid 6-digit code']
  };
};

// Form validation helpers
export const validateLoginForm = (email: string, password: string): FormErrors => {
  const errors: FormErrors = {};
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.errors[0];
  }
  
  if (!password.trim()) {
    errors.password = 'Password is required';
  }
  
  return errors;
};

export const validateSignupForm = (formData: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  phone?: string;
}): FormErrors => {
  const errors: FormErrors = {};
  
  // Name validation
  const nameValidation = validateName(formData.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.errors[0];
  }
  
  // Email validation
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.errors[0];
  }
  
  // Password validation
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors[0];
  }
  
  // Confirm password validation
  const confirmPasswordValidation = validateConfirmPassword(formData.password, formData.confirmPassword);
  if (!confirmPasswordValidation.isValid) {
    errors.confirmPassword = confirmPasswordValidation.errors[0];
  }
  
  // Role validation
  if (!formData.role) {
    errors.role = 'Please select a role';
  }
  
  // Phone validation (optional)
  if (formData.phone) {
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.errors[0];
    }
  }
  
  return errors;
};

export const validateForgotPasswordForm = (email: string): FormErrors => {
  const errors: FormErrors = {};
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.errors[0];
  }
  
  return errors;
};

export const validateResetPasswordForm = (newPassword: string, confirmPassword: string): FormErrors => {
  const errors: FormErrors = {};
  
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    errors.newPassword = passwordValidation.errors[0];
  }
  
  const confirmPasswordValidation = validateConfirmPassword(newPassword, confirmPassword);
  if (!confirmPasswordValidation.isValid) {
    errors.confirmPassword = confirmPasswordValidation.errors[0];
  }
  
  return errors;
};

// Change password validation
export const validateChangePasswordForm = (currentPassword: string, newPassword: string, confirmPassword: string): FormErrors => {
  const errors: FormErrors = {};
  
  if (!currentPassword.trim()) {
    errors.currentPassword = 'Current password is required';
  }
  
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    errors.newPassword = passwordValidation.errors[0];
  }
  
  const confirmPasswordValidation = validateConfirmPassword(newPassword, confirmPassword);
  if (!confirmPasswordValidation.isValid) {
    errors.confirmPassword = confirmPasswordValidation.errors[0];
  }
  
  if (currentPassword === newPassword) {
    errors.newPassword = 'New password must be different from current password';
  }
  
  return errors;
};

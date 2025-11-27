import { useCallback, useState } from 'react';
import { FormErrors } from '../types';
import { validateForgotPasswordForm, validateResetCode, validateResetPasswordForm } from '../utils/validation';
import { useFormValidation } from './useFormValidation';

export const useForgotPassword = () => {
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const [isLoading, setIsLoading] = useState({
    sendingCode: false,
    verifyingCode: false,
    resettingPassword: false
  });

  const { errors, validateForm, clearErrors, hasError, getError } = useFormValidation();

  const validateEmailStep = useCallback(() => {
    return validateForm(() => validateForgotPasswordForm(forgotEmail));
  }, [forgotEmail, validateForm]);

  const validateCodeStep = useCallback(() => {
    return validateForm((): FormErrors => {
      const result = validateResetCode(resetCode);
      if (result.isValid) {
        return {};
      }
      return { resetCode: result.errors[0] || 'Invalid code' };
    });
  }, [resetCode, validateForm]);

  const validatePasswordStep = useCallback(() => {
    return validateForm(() => validateResetPasswordForm(newPassword, confirmPassword));
  }, [newPassword, confirmPassword, validateForm]);

  const reset = useCallback(() => {
    setForgotEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setCodeVerified(false);
    setCountdown(0);
    setIsLoading({
      sendingCode: false,
      verifyingCode: false,
      resettingPassword: false
    });
    clearErrors();
  }, [clearErrors]);

  const setLoadingState = useCallback((key: keyof typeof isLoading, value: boolean) => {
    setIsLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  const startCountdown = useCallback((seconds: number = 600) => {
    setCountdown(seconds);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  return {
    // Form values
    forgotEmail,
    resetCode,
    newPassword,
    confirmPassword,
    showNewPassword,
    showConfirmPassword,
    codeVerified,
    countdown,
    isLoading,
    
    // Form actions
    setForgotEmail,
    setResetCode,
    setNewPassword,
    setConfirmPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    setCodeVerified,
    setLoadingState,
    startCountdown,
    reset,
    
    // Validation
    validateEmailStep,
    validateCodeStep,
    validatePasswordStep,
    errors,
    hasError,
    getError,
    
    // Computed values
    canSendCode: forgotEmail.trim() !== '' && !isLoading.sendingCode,
    canVerifyCode: resetCode.length === 6 && !isLoading.verifyingCode,
    canResetPassword: newPassword.trim() !== '' && confirmPassword.trim() !== '' && !isLoading.resettingPassword
  };
};

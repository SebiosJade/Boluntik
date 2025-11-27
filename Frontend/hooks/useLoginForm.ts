import { useCallback, useState } from 'react';
import { validateLoginForm } from '../utils/validation';
import { useFormValidation } from './useFormValidation';

export const useLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { errors, validateForm, clearErrors, hasError, getError } = useFormValidation();

  const validate = useCallback(() => {
    return validateForm(() => validateLoginForm(email, password));
  }, [email, password, validateForm]);

  const reset = useCallback(() => {
    setEmail('');
    setPassword('');
    setRememberMe(false);
    setIsSubmitting(false);
    clearErrors();
  }, [clearErrors]);

  const setFieldValue = useCallback((field: 'email' | 'password' | 'rememberMe', value: string | boolean) => {
    switch (field) {
      case 'email':
        setEmail(value as string);
        break;
      case 'password':
        setPassword(value as string);
        break;
      case 'rememberMe':
        setRememberMe(value as boolean);
        break;
    }
  }, []);

  return {
    // Form values
    email,
    password,
    rememberMe,
    isSubmitting,
    
    // Form actions
    setFieldValue,
    setEmail,
    setPassword,
    setRememberMe,
    setIsSubmitting,
    
    // Validation
    validate,
    reset,
    errors,
    hasError,
    getError,
    
    // Computed values
    isValid: email.trim() !== '' && password.trim() !== '' && Object.keys(errors).length === 0
  };
};

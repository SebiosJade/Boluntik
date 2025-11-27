import { useCallback, useState } from 'react';
import { FormErrors } from '../types';

export const useFormValidation = () => {
  const [errors, setErrors] = useState<FormErrors>({});

  const validateField = useCallback((fieldName: string, value: string, validationFn: (value: string) => { isValid: boolean; errors: string[] }) => {
    const result = validationFn(value);
    if (result.isValid) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    } else {
      setErrors(prev => ({
        ...prev,
        [fieldName]: result.errors[0]
      }));
    }
    return result.isValid;
  }, []);

  const validateForm = useCallback((validationFn: () => FormErrors) => {
    const formErrors = validationFn();
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const hasError = useCallback((fieldName: string) => {
    return !!errors[fieldName];
  }, [errors]);

  const getError = useCallback((fieldName: string) => {
    return errors[fieldName] || '';
  }, [errors]);

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    hasError,
    getError
  };
};

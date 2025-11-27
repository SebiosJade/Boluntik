import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { API } from '../constants/Api';
import { validateConfirmPassword, validatePassword } from '../utils/validation';

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordState {
  showModal: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  isChanging: boolean;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
}

interface ChangePasswordActions {
  openModal: () => void;
  closeModal: () => void;
  setCurrentPassword: (password: string) => void;
  setNewPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  toggleCurrentPasswordVisibility: () => void;
  toggleNewPasswordVisibility: () => void;
  toggleConfirmPasswordVisibility: () => void;
  changePassword: (token: string) => Promise<boolean>;
}

// Functional alert function that works across platforms
const showFunctionalAlert = (
  title: string, 
  message?: string, 
  buttons?: Array<{text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive'}>
) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const result = window.confirm(`${title}\n\n${message || ''}`);
      if (result && buttons[0]?.onPress) {
        buttons[0].onPress();
      } else if (!result && buttons[1]?.onPress) {
        buttons[1].onPress();
      }
    } else {
      window.alert(`${title}\n\n${message || ''}`);
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

export const useChangePassword = (): ChangePasswordState & ChangePasswordActions => {
  const [state, setState] = useState<ChangePasswordState>({
    showModal: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    isChanging: false,
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
  });

  const openModal = () => {
    setState(prev => ({ ...prev, showModal: true }));
  };

  const closeModal = () => {
    setState(prev => ({
      ...prev,
      showModal: false,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
    }));
  };

  const setCurrentPassword = (password: string) => {
    setState(prev => ({ ...prev, currentPassword: password }));
  };

  const setNewPassword = (password: string) => {
    setState(prev => ({ ...prev, newPassword: password }));
  };

  const setConfirmPassword = (password: string) => {
    setState(prev => ({ ...prev, confirmPassword: password }));
  };

  const toggleCurrentPasswordVisibility = () => {
    setState(prev => ({ ...prev, showCurrentPassword: !prev.showCurrentPassword }));
  };

  const toggleNewPasswordVisibility = () => {
    setState(prev => ({ ...prev, showNewPassword: !prev.showNewPassword }));
  };

  const toggleConfirmPasswordVisibility = () => {
    setState(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }));
  };

  const validatePasswordForm = (data: ChangePasswordData): boolean => {
    // Validate current password
    if (!data.currentPassword.trim()) {
      showFunctionalAlert('Error', 'Please enter your current password');
      return false;
    }
    
    // Validate new password
    const passwordValidation = validatePassword(data.newPassword);
    if (!passwordValidation.isValid) {
      showFunctionalAlert('Error', passwordValidation.errors[0]);
      return false;
    }
    
    // Validate confirm password
    const confirmPasswordValidation = validateConfirmPassword(data.newPassword, data.confirmPassword);
    if (!confirmPasswordValidation.isValid) {
      showFunctionalAlert('Error', confirmPasswordValidation.errors[0]);
      return false;
    }
    
    // Check if new password is different from current
    if (data.currentPassword === data.newPassword) {
      showFunctionalAlert('Error', 'New password must be different from current password');
      return false;
    }
    
    return true;
  };

  const changePassword = async (token: string): Promise<boolean> => {
    const passwordData: ChangePasswordData = {
      currentPassword: state.currentPassword,
      newPassword: state.newPassword,
      confirmPassword: state.confirmPassword,
    };

    if (!validatePasswordForm(passwordData)) {
      return false;
    }

    if (!token) {
      showFunctionalAlert('Error', 'Authentication token not found');
      return false;
    }

    setState(prev => ({ ...prev, isChanging: true }));
    
    try {
      const response = await fetch(API.changePassword, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showFunctionalAlert(
          'Success',
          'Your password has been successfully changed.',
          [
            {
              text: 'OK',
              onPress: closeModal,
            },
          ]
        );
        return true;
      } else {
        showFunctionalAlert('Error', data.message || 'Failed to change password');
        return false;
      }
    } catch (error) {
      console.error('Change password error:', error);
      showFunctionalAlert('Error', 'Network error. Please check your connection and try again.');
      return false;
    } finally {
      setState(prev => ({ ...prev, isChanging: false }));
    }
  };

  return {
    ...state,
    openModal,
    closeModal,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    toggleCurrentPasswordVisibility,
    toggleNewPasswordVisibility,
    toggleConfirmPasswordVisibility,
    changePassword,
  };
};

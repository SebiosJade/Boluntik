import React, { createContext, ReactNode, useContext } from 'react';
import { Alert, Platform } from 'react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertContextType {
  showAlert: (title: string, message?: string, buttons?: AlertButton[], type?: 'success' | 'error' | 'warning' | 'info') => void;
  showConfirm: (title: string, message?: string) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const showAlert = (
    title: string, 
    message?: string, 
    buttons?: AlertButton[], 
    type?: 'success' | 'error' | 'warning' | 'info'
  ) => {
    // Use React Native's built-in Alert
    if (Platform.OS === 'web') {
      // For web, use browser alert
      window.alert(`${title}\n\n${message || ''}`);
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    } else {
      // For native (iOS/Android), use Alert.alert
      Alert.alert(title, message, buttons);
    }
  };

  const showConfirm = (title: string, message?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (Platform.OS === 'web') {
        // For web, use browser confirm
        const result = window.confirm(`${title}\n\n${message || ''}`);
        resolve(result);
      } else {
        // For native (iOS/Android), use Alert.alert
        Alert.alert(
          title,
          message,
          [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            { text: 'OK', onPress: () => resolve(true) }
          ]
        );
      }
    });
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
    </AlertContext.Provider>
  );
};

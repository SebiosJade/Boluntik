import { Alert, Platform } from 'react-native';

// Simple web-compatible alert function using React Native's built-in Alert
export const webAlert = (
  title: string, 
  message?: string, 
  buttons?: Array<{text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive'}>, 
  type?: 'success' | 'error' | 'warning' | 'info'
) => {
  if (Platform.OS === 'web') {
    // For web, use browser's native alert/confirm
    if (buttons && buttons.length > 1) {
      // For multiple buttons, use confirm dialog
      const result = window.confirm(`${title}\n\n${message || ''}`);
      if (result && buttons[1]?.onPress) {
        buttons[1].onPress();
      } else if (!result && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    } else {
      // For single button or no buttons, use alert
      window.alert(`${title}\n\n${message || ''}`);
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    // For native (iOS/Android), use React Native's Alert.alert
    Alert.alert(title, message, buttons);
  }
};

// Simple web-compatible confirm function using React Native's built-in Alert
export const webConfirm = (title: string, message?: string): Promise<boolean> => {
  if (Platform.OS === 'web') {
    // For web, use browser's native confirm
    return Promise.resolve(window.confirm(`${title}\n\n${message || ''}`));
  } else {
    // For native (iOS/Android), use React Native's Alert.alert
    return new Promise((resolve) => {
      Alert.alert(
        title,
        message,
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'OK', onPress: () => resolve(true) }
        ]
      );
    });
  }
};

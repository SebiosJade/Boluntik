import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ImageProps, StyleSheet, View } from 'react-native';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSource?: ImageProps['source'];
  showPlaceholder?: boolean;
  placeholderIcon?: keyof typeof Ionicons.glyphMap;
  onLoad?: () => void;
  onError?: () => void;
  loadingSize?: 'small' | 'large';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  fallbackSource,
  showPlaceholder = true,
  placeholderIcon = 'image',
  onLoad,
  onError,
  loadingSize = 'small',
  style,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
    onError?.();
  }, [onError]);

  const renderPlaceholder = () => (
    <View style={[styles.placeholder, style]}>
      <Ionicons 
        name={placeholderIcon} 
        size={loadingSize === 'small' ? 24 : 48} 
        color="#9CA3AF" 
      />
    </View>
  );

  const renderLoading = () => (
    <View style={[styles.loadingContainer, style]}>
      <ActivityIndicator size={loadingSize} color="#3B82F6" />
    </View>
  );

  if (error && fallbackSource) {
    return (
      <Image
        source={fallbackSource}
        style={style}
        onLoad={handleLoad}
        onError={() => setError(true)}
        {...props}
      />
    );
  }

  if (error && !fallbackSource && showPlaceholder) {
    return renderPlaceholder();
  }

  return (
    <View style={style}>
      {loading && renderLoading()}
      <Image
        source={source}
        style={[style, loading && styles.hidden]}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hidden: {
    opacity: 0,
  },
});

export default OptimizedImage;

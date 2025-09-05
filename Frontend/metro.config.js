const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper resolution of assets and modules
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add support for additional file extensions if needed
config.resolver.sourceExts.push('cjs');

module.exports = config;

const jwt = require('jsonwebtoken');
const config = require('../../config');
const logger = require('../../utils/logger');

// Logout user
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    // Verify the token to ensure it's valid before logout
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      logger.info(`User ${decoded.userId} logged out successfully`);
      
      // In a more sophisticated system, you might:
      // 1. Add the token to a blacklist
      // 2. Store logout timestamp in database
      // 3. Clear any server-side sessions
      
      // For now, we'll just return success
      // The client should remove the token from storage
      res.json({ 
        message: 'Logged out successfully',
        userId: decoded.userId 
      });
    } catch (tokenError) {
      logger.warn('Invalid token during logout:', tokenError.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    logger.error('Error during logout:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
};

module.exports = {
  logout
};

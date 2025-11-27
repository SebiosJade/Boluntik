const Resource = require('../../models/Resource');
const Notification = require('../../models/Notification');
const { findUserById } = require('../../database/dataAccess');
const logger = require('../../utils/logger');

// Get all active offers (Browse Offers)
exports.getActiveOffers = async (req, res) => {
  try {
    const offers = await Resource.getActiveOffers();
    
    res.status(200).json({
      status: 'success',
      results: offers.length,
      data: { offers },
    });
  } catch (error) {
    logger.error('Error fetching active offers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch offers',
    });
  }
};

// Get all active requests (Browse Requests)
exports.getActiveRequests = async (req, res) => {
  try {
    const requests = await Resource.getActiveRequests();
    
    res.status(200).json({
      status: 'success',
      results: requests.length,
      data: { requests },
    });
  } catch (error) {
    logger.error('Error fetching active requests:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch requests',
    });
  }
};

// Get user's own offers (My Offers)
exports.getUserOffers = async (req, res) => {
  try {
    const userId = req.user.id;
    const offers = await Resource.getUserOffers(userId);
    
    res.status(200).json({
      status: 'success',
      results: offers.length,
      data: { offers },
    });
  } catch (error) {
    logger.error('Error fetching user offers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch your offers',
    });
  }
};

// Get user's own requests (My Requests)
exports.getUserRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await Resource.getUserRequests(userId);
    
    res.status(200).json({
      status: 'success',
      results: requests.length,
      data: { requests },
    });
  } catch (error) {
    logger.error('Error fetching user requests:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch your requests',
    });
  }
};

// Get resources user has requested from others (Requested From Others)
exports.getRequestedFromOthers = async (req, res) => {
  try {
    const userId = req.user.id;
    const resources = await Resource.getUserRequestedFromOthers(userId);
    
    // Filter to only show user's interactions
    const filtered = resources.map(resource => {
      const userInteractions = resource.interactions.filter(i => i.userId === userId);
      return {
        ...resource.toObject(),
        myInteraction: userInteractions[0] || null,
      };
    });
    
    res.status(200).json({
      status: 'success',
      results: filtered.length,
      data: { resources: filtered },
    });
  } catch (error) {
    logger.error('Error fetching requested from others:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch your requests',
    });
  }
};

// Get resources where user has offered help (Help I've Offered)
exports.getHelpOffered = async (req, res) => {
  try {
    const userId = req.user.id;
    const resources = await Resource.getUserHelpOffered(userId);
    
    // Filter to only show user's interactions
    const filtered = resources.map(resource => {
      const userInteractions = resource.interactions.filter(i => i.userId === userId);
      return {
        ...resource.toObject(),
        myInteraction: userInteractions[0] || null,
      };
    });
    
    res.status(200).json({
      status: 'success',
      results: filtered.length,
      data: { resources: filtered },
    });
  } catch (error) {
    logger.error('Error fetching help offered:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch your offers',
    });
  }
};

// Create a new resource (offer or request)
exports.createResource = async (req, res) => {
  try {
    const { type, title, description, category, quantity, location } = req.body;
    const userId = req.user.id;
    
    if (!type || !title || !description || !category || !location) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields',
      });
    }
    
    // Fetch full user details to get email
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }
    
    const resource = await Resource.create({
      ownerId: user.id,
      ownerName: user.name || user.organizationName || 'Unknown',
      ownerEmail: user.email,
      ownerRole: user.role,
      type,
      title,
      description,
      category,
      quantity: quantity || '1',
      location,
    });
    
    logger.info(`Resource created: ${resource._id} by ${user.id}`);
    
    res.status(201).json({
      status: 'success',
      data: { resource },
    });
  } catch (error) {
    logger.error('Error creating resource:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create resource',
    });
  }
};

// Update a resource
exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, quantity, location } = req.body;
    const userId = req.user.id;
    
    const resource = await Resource.findById(id);
    
    if (!resource) {
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found',
      });
    }
    
    // Check ownership
    if (resource.ownerId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only update your own resources',
      });
    }
    
    // Update fields
    if (title) resource.title = title;
    if (description) resource.description = description;
    if (category) resource.category = category;
    if (quantity) resource.quantity = quantity;
    if (location) resource.location = location;
    
    await resource.save();
    
    res.status(200).json({
      status: 'success',
      data: { resource },
    });
  } catch (error) {
    logger.error('Error updating resource:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update resource',
    });
  }
};

// Delete a resource
exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const resource = await Resource.findById(id);
    
    if (!resource) {
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found',
      });
    }
    
    // Check ownership
    if (resource.ownerId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only delete your own resources',
      });
    }
    
    await Resource.findByIdAndDelete(id);
    
    res.status(200).json({
      status: 'success',
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting resource:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete resource',
    });
  }
};

// Request a resource (for offers) or Offer help (for requests)
exports.createInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;
    
    const resource = await Resource.findById(id);
    
    if (!resource) {
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found',
      });
    }
    
    // Check if resource is active
    if (resource.status !== 'active') {
      return res.status(400).json({
        status: 'error',
        message: 'This resource is no longer available',
      });
    }
    
    // Check if user is trying to interact with their own resource
    if (resource.ownerId === userId) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot interact with your own resource',
      });
    }
    
    // Check if user has already interacted
    const existingInteraction = resource.interactions.find(i => i.userId === userId);
    if (existingInteraction) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already interacted with this resource',
      });
    }
    
    // Fetch full user details to get email
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }
    
    // Add interaction
    const updatedResource = await resource.addInteraction({
      userId: user.id,
      userName: user.name || user.organizationName || 'Unknown',
      userEmail: user.email,
      userRole: user.role,
      message: message || '',
    });
    
    // Get the newly created interaction
    const newInteraction = updatedResource.interactions[updatedResource.interactions.length - 1];
    
    // Send notification to resource owner
    try {
      if (resource.type === 'offer') {
        // User is requesting an offer
        await Notification.createResourceRequestNotification(
          resource.ownerId,
          user.name || user.organizationName || 'Unknown',
          resource.title,
          resource._id.toString(),
          newInteraction._id.toString()
        );
      } else {
        // User is offering help on a request
        await Notification.createResourceOfferNotification(
          resource.ownerId,
          user.name || user.organizationName || 'Unknown',
          resource.title,
          resource._id.toString(),
          newInteraction._id.toString()
        );
      }
    } catch (notifError) {
      logger.error('Error creating notification:', notifError);
      // Don't fail the request if notification fails
    }
    
    logger.info(`Interaction created on resource ${id} by ${user.id}`);
    
    res.status(201).json({
      status: 'success',
      data: { resource: updatedResource },
    });
  } catch (error) {
    logger.error('Error creating interaction:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create interaction',
    });
  }
};

// Accept or decline an interaction
exports.updateInteractionStatus = async (req, res) => {
  try {
    const { id, interactionId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be accepted or declined',
      });
    }
    
    const resource = await Resource.findById(id);
    
    if (!resource) {
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found',
      });
    }
    
    // Check ownership
    if (resource.ownerId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only manage interactions on your own resources',
      });
    }
    
    // Find the interaction to get user details
    const interaction = resource.interactions.id(interactionId);
    if (!interaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Interaction not found',
      });
    }
    
    const updatedResource = await resource.updateInteractionStatus(interactionId, status);
    
    // Send notification to the user who made the interaction
    try {
      await Notification.createResourceStatusNotification(
        interaction.userId,
        resource.ownerName,
        resource.title,
        resource.type,
        status,
        resource._id.toString()
      );
      
      // If accepted, also notify about fulfillment
      if (status === 'accepted') {
        // Notify resource owner about fulfillment
        await Notification.createResourceFulfilledNotification(
          resource.ownerId,
          resource.title,
          resource.type,
          resource._id.toString()
        );
      }
    } catch (notifError) {
      logger.error('Error creating notification:', notifError);
      // Don't fail the request if notification fails
    }
    
    res.status(200).json({
      status: 'success',
      data: { resource: updatedResource },
    });
  } catch (error) {
    logger.error('Error updating interaction status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update interaction status',
    });
  }
};

// Get a single resource with details
exports.getResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);
    
    if (!resource) {
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { resource },
    });
  } catch (error) {
    logger.error('Error fetching resource:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch resource',
    });
  }
};


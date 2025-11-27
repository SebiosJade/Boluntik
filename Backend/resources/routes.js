const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const resourceController = require('./controllers/resourceController');

// All routes require authentication
router.use(protect);

// Browse resources
router.get('/offers', resourceController.getActiveOffers);
router.get('/requests', resourceController.getActiveRequests);

// User's own resources
router.get('/my-offers', resourceController.getUserOffers);
router.get('/my-requests', resourceController.getUserRequests);

// User's interactions
router.get('/requested-from-others', resourceController.getRequestedFromOthers);
router.get('/help-offered', resourceController.getHelpOffered);

// CRUD operations
router.post('/', resourceController.createResource);
router.get('/:id', resourceController.getResource);
router.put('/:id', resourceController.updateResource);
router.delete('/:id', resourceController.deleteResource);

// Interactions
router.post('/:id/interact', resourceController.createInteraction);
router.patch('/:id/interactions/:interactionId', resourceController.updateInteractionStatus);

module.exports = router;



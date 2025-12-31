const express = require('express');
const router = express.Router();
const NotificationTestController = require('../Controller/Notifications/NotificationTestController');

// Test notification endpoint
router.post('/test', NotificationTestController.testNotification);

// Get notification configuration status
router.get('/status', NotificationTestController.getNotificationStatus);

module.exports = router;


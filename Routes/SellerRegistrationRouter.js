const express = require('express');
const router = express.Router();
const SellerRegistrationController = require('../Controller/SellerRegistration/SellerRegistrationController');

// Public route - sellers submit registration here
router.post('/Submit', SellerRegistrationController.SubmitRegistration);

module.exports = router;


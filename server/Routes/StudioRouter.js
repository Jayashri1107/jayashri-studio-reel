const express = require('express');
const router = express.Router();
const {
    sellerLogin,
    setSellerPassword,
    sellerLoginWithPassword,
    applyForInfluencer,
    influencerLogin,
    checkSellerDetails,
    registerSellerForReels,
    checkSellerEmail,
    applyForInfluencerReels,
    getAllInfluencerApplications,
    approveInfluencer,
    rejectInfluencer,
    requestSellerPasswordReset,
    requestInfluencerPasswordReset,
    resetSellerPassword,
    resetInfluencerPassword
} = require('../Controller/Studio/StudioAuthController');

// Seller routes
router.post('/seller/login', sellerLogin);
router.post('/seller/set-password', setSellerPassword);
router.post('/seller/login-with-password', sellerLoginWithPassword);
router.post('/seller/check-details', checkSellerDetails);
router.post('/seller/register-for-reels', registerSellerForReels);
router.post('/seller/check-email', checkSellerEmail);
router.post('/seller/forgot-password', requestSellerPasswordReset);
router.post('/seller/reset-password', resetSellerPassword);

// Influencer routes
router.post('/influencer/apply', applyForInfluencer);
router.post('/influencer/login', influencerLogin);
router.post('/influencer/apply-for-reels', applyForInfluencerReels);
router.get('/influencer/applications', getAllInfluencerApplications);
router.put('/influencer/:id/approve', approveInfluencer);
router.put('/influencer/:id/reject', rejectInfluencer);
router.post('/influencer/forgot-password', requestInfluencerPasswordReset);
router.post('/influencer/reset-password', resetInfluencerPassword);

module.exports = router;

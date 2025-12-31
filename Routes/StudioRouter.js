const express = require('express');
const router = express.Router();
const db = require('../Config/db');
const { verifyToken } = require('../Middleware/AuthMiddleware');
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
    updateInfluencer,
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
router.put('/influencer/:id', updateInfluencer);
router.put('/influencer/:id/approve', approveInfluencer);
router.put('/influencer/:id/reject', rejectInfluencer);
router.post('/influencer/forgot-password', requestInfluencerPasswordReset);
router.post('/influencer/reset-password', resetInfluencerPassword);

// Seller profile stats: followers and views
router.get('/seller/profile', verifyToken, async (req, res) => {
    try {
        const sellerId = req.query.id || req.query.vendorId || req.user?.id;
        if (!sellerId) {
            return res.status(400).json({ success: false, message: 'Seller ID is required' });
        }
        const followersQ = 'SELECT COUNT(*) AS followers FROM oc_seller_follow WHERE seller_id = ?';
        const reelsQ = 'SELECT COUNT(*) AS reels FROM oc_seller_reels WHERE seller_id = ?';
        const viewsQ = `
            SELECT COUNT(*) AS views 
            FROM oc_reels_views 
            WHERE reel_id IN (SELECT reel_id FROM oc_seller_reels WHERE seller_id = ?)
        `;
        const viewsFallbackQ = 'SELECT COALESCE(SUM(views), 0) AS views FROM oc_seller_reels WHERE seller_id = ?';
        const followers = await new Promise((resolve, reject) => {
            db.query(followersQ, [sellerId], (err, rows) => err ? reject(err) : resolve(rows[0]?.followers || 0));
        });
        const reels = await new Promise((resolve, reject) => {
            db.query(reelsQ, [sellerId], (err, rows) => err ? reject(err) : resolve(rows[0]?.reels || 0));
        });
        let views = 0;
        try {
            views = await new Promise((resolve, reject) => {
                db.query(viewsQ, [sellerId], (err, rows) => err ? reject(err) : resolve(rows[0]?.views || 0));
            });
        } catch (e) {
            views = await new Promise((resolve, reject) => {
                db.query(viewsFallbackQ, [sellerId], (err, rows) => err ? reject(err) : resolve(rows[0]?.views || 0));
            });
        }
        return res.json({
            success: true,
            data: { id: Number(sellerId), followers, totalViews: views, reels }
        });
    } catch (error) {
        console.error('Seller profile error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch seller profile', error: error.message });
    }
});

// Influencer profile stats: followers and views
router.get('/influencers/profile', verifyToken, async (req, res) => {
    try {
        const influencerId = req.query.id || req.user?.id;
        if (!influencerId) {
            return res.status(400).json({ success: false, message: 'Influencer ID is required' });
        }
        const followersQ = 'SELECT COUNT(*) AS followers FROM oc_influencer_follow WHERE influencer_id = ?';
        const reelsQ = 'SELECT COUNT(*) AS reels FROM oc_influencer_reels WHERE influencer_id = ?';
        const viewsQ = `
            SELECT COUNT(*) AS views 
            FROM oc_reels_views 
            WHERE reel_id IN (SELECT reel_id FROM oc_influencer_reels WHERE influencer_id = ?)
        `;
        const viewsFallbackQ = 'SELECT COALESCE(SUM(views), 0) AS views FROM oc_influencer_reels WHERE influencer_id = ?';
        const followers = await new Promise((resolve, reject) => {
            db.query(followersQ, [influencerId], (err, rows) => err ? reject(err) : resolve(rows[0]?.followers || 0));
        });
        const reels = await new Promise((resolve, reject) => {
            db.query(reelsQ, [influencerId], (err, rows) => err ? reject(err) : resolve(rows[0]?.reels || 0));
        });
        let views = 0;
        try {
            views = await new Promise((resolve, reject) => {
                db.query(viewsQ, [influencerId], (err, rows) => err ? reject(err) : resolve(rows[0]?.views || 0));
            });
        } catch (e) {
            views = await new Promise((resolve, reject) => {
                db.query(viewsFallbackQ, [influencerId], (err, rows) => err ? reject(err) : resolve(rows[0]?.views || 0));
            });
        }
        return res.json({
            success: true,
            data: { id: Number(influencerId), followers, totalViews: views, reels }
        });
    } catch (error) {
        console.error('Influencer profile error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch influencer profile', error: error.message });
    }
});

module.exports = router;

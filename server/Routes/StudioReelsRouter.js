const express = require('express');
const router = express.Router();
const {
    uploadInfluencerReel,
    uploadSellerReel,
    uploadBrandReel,
    getInfluencerReels,
    getSellerReels,
    getCategories,
    getSellers,
    getSellerProducts,
    getBrands,
    getBrandProducts,
    getRelatedProducts,
    getProductNamesByIds,
    getAllProducts,
    incrementReelView,
    toggleReelLike,
    toggleCreatorFollow,
    getReelById,
    editReel,
    deleteReel,
    getSellerDashboardStats,
    getRecentSellerReels,
    getApprovedReelsCount
} = require('../Controller/Studio/ReelsController');
const { verifyToken, verifyInfluencer, verifySeller } = require('../Middleware/AuthMiddleware');
const db = require('../Config/db'); // Add database connection

// Middleware to handle file uploads
const upload = require('../Config/multerConfig');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for profile image uploads
const profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Store profile images in the studio public assets directory
        const profileDir = path.join(__dirname, '../../studio/public/assets/images/users');
        if (!fs.existsSync(profileDir)) {
            fs.mkdirSync(profileDir, { recursive: true });
        }
        cb(null, profileDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename for profile images
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + ext);
    }
});

const profileUpload = multer({
    storage: profileStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for profile images
    },
    fileFilter: (req, file, cb) => {
        // Allow only image files for profile images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only image files are allowed for profile pictures.'));
        }
    }
});

/**
 * @route   POST /api/studio/reels/profile/image
 * @desc    Upload a profile image
 * @access  Private (Authenticated users)
 */
router.post('/profile/image', verifyToken, profileUpload.single('profileImage'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        // Return the path to the uploaded file
        const imagePath = `/assets/images/users/${req.file.filename}`;
        res.json({ 
            success: true, 
            message: 'Profile image uploaded successfully',
            imagePath: imagePath
        });
    } catch (error) {
        console.error('Profile image upload error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload profile image' });
    }
});

/**
 * @route   PUT /api/studio/reels/profile/image
 * @desc    Update profile image path in database
 * @access  Private (Authenticated users)
 */
router.put('/profile/image', verifyToken, (req, res) => {
    try {
        const { imagePath } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        
        // Validate inputs
        if (!imagePath) {
            return res.status(400).json({ 
                success: false, 
                message: 'Image path is required' 
            });
        }
        
        let query = '';
        let tableName = '';
        
        // Determine which table to update based on user role
        if (userRole === 'influencer') {
            query = `UPDATE oc_influencers SET profile_image = ? WHERE id = ?`;
            tableName = 'oc_influencers';
        } else if (userRole === 'seller') {
            query = `UPDATE oc_sellers SET profile_image = ? WHERE id = ?`;
            tableName = 'oc_sellers';
        } else {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized role for profile image update' 
            });
        }
        
        db.query(query, [imagePath, userId], (err, result) => {
            if (err) {
                console.error(`Database error updating profile image in ${tableName}:`, err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to update profile image',
                    error: err.message 
                });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }
            
            res.json({ 
                success: true, 
                message: 'Profile image updated successfully'
            });
        });
    } catch (error) {
        console.error('Profile image update error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile image' });
    }
});

/**
 * @route   POST /api/studio/reels/influencer/upload
 * @desc    Upload a new influencer reel
 * @access  Private (Influencer only)
 */
router.post('/influencer/upload', verifyInfluencer, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), uploadInfluencerReel);

/**
 * @route   POST /api/studio/reels/seller/upload
 * @desc    Upload a new seller reel
 * @access  Private (Seller only)
 */
router.post('/seller/upload', verifySeller, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), uploadSellerReel);

/**
 * @route   POST /api/studio/reels/brand/upload
 * @desc    Upload a new brand reel
 * @access  Private (Authenticated users)
 */
router.post('/brand/upload', verifyToken, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), uploadBrandReel);

/**
 * @route   POST /api/studio/reels/brand-reel-upload
 * @desc    Upload a new brand reel (alternative route for compatibility)
 * @access  Private (Authenticated users)
 */
router.post('/brand-reel-upload', verifyToken, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), uploadBrandReel);

/**
 * @route   GET /api/studio/reels/influencer/my-reels
 * @desc    Get reels for the authenticated influencer
 * @access  Private (Influencer only)
 */
router.get('/influencer/my-reels', verifyToken, verifyInfluencer, getInfluencerReels);

/**
 * @route   GET /api/studio/reels/influencers/reels
 * @desc    Get all influencer reels for admin list
 * @access  Public
 */
router.get('/influencers/reels', (req, res) => {
    // Import the function here to avoid circular dependencies
    const { getInfluencerReelsAdmin } = require('../Controller/Studio/ReelsController');
    getInfluencerReelsAdmin(req, res);
});

/**
 * @route   GET /api/studio/reels/influencer/:influencerId/reels
 * @desc    Get reels for a specific influencer
 * @access  Public
 */
router.get('/influencer/:influencerId/reels', (req, res) => {
    // Import the function here to avoid circular dependencies
    const { getInfluencerReelsById } = require('../Controller/Studio/ReelsController');
    getInfluencerReelsById(req, res);
});

/**
 * @route   GET /api/studio/reels/seller/:vendorId/reels
 * @desc    Get reels for a specific seller
 * @access  Private (Seller only)
 */
router.get('/seller/:vendorId/reels', verifySeller, getSellerReels);

/**
 * @route   GET /api/studio/reels/seller/:vendorId/public
 * @desc    Get reels for a specific seller (public)
 * @access  Public
 */
// Temporary workaround - using the same function but without authentication
router.get('/seller/:vendorId/public', getSellerReels);

/**
 * @route   GET /api/studio/reels/seller/:vendorId/dashboard-stats
 * @desc    Get dashboard statistics for a specific seller
 * @access  Private (Seller only)
 */
router.get('/seller/:vendorId/dashboard-stats', verifySeller, getSellerDashboardStats);

/**
 * @route   GET /api/studio/reels/seller/:vendorId/recent-reels
 * @desc    Get recent reels for a specific seller
 * @access  Private (Seller only)
 */
router.get('/seller/:vendorId/recent-reels', verifySeller, getRecentSellerReels);

/**
 * @route   GET /api/studio/reels/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/categories', getCategories);

/**
 * @route   GET /api/studio/reels/sellers
 * @desc    Get all sellers
 * @access  Public
 */
router.get('/sellers', getSellers);

/**
 * @route   GET /api/studio/reels/brands
 * @desc    Get all brands
 * @access  Public
 */
router.get('/brands', getBrands);

/**
 * @route   GET /api/studio/reels/brand-reels
 * @desc    Get all brand reels (reels with brand_id)
 * @access  Public
 */
router.get('/brand-reels', (req, res) => {
    // Import the function here to avoid circular dependencies
    const { getBrandReels } = require('../Controller/Studio/ReelsController');
    getBrandReels(req, res);
});

/**
 * @route   GET /api/studio/reels/sellers/:vendorId/products
 * @desc    Get products for a specific seller
 * @access  Public
 */
router.get('/sellers/:vendorId/products', getSellerProducts);

/**
 * @route   GET /api/studio/reels/brands/:brandId/products
 * @desc    Get products for a specific brand
 * @access  Public
 */
router.get('/brands/:brandId/products', getBrandProducts);

/**
 * @route   POST /api/studio/reels/related-products
 * @desc    Get related products based on selected products
 * @access  Public
 */
router.post('/related-products', getRelatedProducts);

/**
 * @route   POST /api/studio/reels/product-names
 * @desc    Get product names by IDs
 * @access  Public
 */
router.post('/product-names', getProductNamesByIds);

/**
 * @route   GET /api/studio/reels/products/all
 * @desc    Get all products
 * @access  Public
 */
router.get('/products/all', getAllProducts);

/**
 * @route   GET /api/studio/reels/approved-counts
 * @desc    Get approved reels count across all sellers and influencers
 * @access  Public
 */
router.get('/approved-counts', getApprovedReelsCount);

/**
 * @route   PUT /api/studio/reels/:id
 * @desc    Edit a specific reel
 * @access  Private (Authenticated users)
 */
router.put('/:id', verifyToken, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), editReel);

/**
 * @route   POST /api/studio/reels/:id/view
 * @desc    Increment view count for a specific reel
 * @access  Public
 */
router.post('/:id/view', incrementReelView);

/**
 * @route   POST /api/studio/reels/:id/like
 * @desc    Toggle like for a specific reel
 * @access  Private (Authenticated users)
 */
router.post('/:id/like', verifyToken, toggleReelLike);

/**
 * @route   POST /api/studio/reels/:id/follow
 * @desc    Toggle follow for the creator of a specific reel
 * @access  Private (Authenticated users)
 */
router.post('/:id/follow', verifyToken, toggleCreatorFollow);

/**
 * @route   GET /api/studio/reels/:id
 * @desc    Get a specific reel by ID
 * @access  Private (Authenticated users)
 */
router.get('/:id', verifyToken, getReelById);

/**
 * @route   POST /api/studio/reels/seller-reels/:id/approve
 * @desc    Approve a specific seller reel
 * @access  Private (Authenticated users)
 */
router.post('/seller-reels/:id/approve', verifyToken, (req, res) => {
    // Import the function here to avoid circular dependencies
    const { approveSellerReel } = require('../Controller/Studio/ReelsController');
    approveSellerReel(req, res);
});

/**
 * @route   POST /api/studio/reels/seller-reels/:id/reject
 * @desc    Reject a specific seller reel
 * @access  Private (Authenticated users)
 */
router.post('/seller-reels/:id/reject', verifyToken, (req, res) => {
    // Import the function here to avoid circular dependencies
    const { rejectSellerReel } = require('../Controller/Studio/ReelsController');
    rejectSellerReel(req, res);
});

/**
 * @route   POST /api/studio/reels/influencer-reels/:id/approve
 * @desc    Approve a specific influencer reel
 * @access  Private (Authenticated users)
 */
router.post('/influencer-reels/:id/approve', verifyToken, (req, res) => {
    // Import the function here to avoid circular dependencies
    const { approveInfluencerReel } = require('../Controller/Studio/ReelsController');
    approveInfluencerReel(req, res);
});

/**
 * @route   POST /api/studio/reels/influencer-reels/:id/reject
 * @desc    Reject a specific influencer reel
 * @access  Private (Authenticated users)
 */
router.post('/influencer-reels/:id/reject', verifyToken, (req, res) => {
    // Import the function here to avoid circular dependencies
    const { rejectInfluencerReel } = require('../Controller/Studio/ReelsController');
    rejectInfluencerReel(req, res);
});

/**
 * @route   DELETE /api/studio/reels/:id
 * @desc    Delete a specific reel
 * @access  Private (Authenticated users)
 */
router.delete('/:id', verifyToken, deleteReel);

/**
 * @route   GET /api/studio/reels/pending-seller-reels
 * @desc    Get all pending seller reels for admin approval
 * @access  Private (Admin only)
 */
router.get('/pending-seller-reels', verifyToken, (req, res) => {
    // Import the function here to avoid circular dependencies
    const { getAllPendingSellerReels } = require('../Controller/Studio/ReelsController');
    getAllPendingSellerReels(req, res);
});

/**
 * @route   GET /api/studio/reels/approved-seller-reels
 * @desc    Get all approved seller reels for admin list
 * @access  Private (Admin only)
 */
router.get('/approved-seller-reels', verifyToken, (req, res) => {
    const { getAllApprovedSellerReels } = require('../Controller/Studio/ReelsController');
    getAllApprovedSellerReels(req, res);
});
module.exports = router;

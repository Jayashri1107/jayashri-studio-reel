const express = require('express');
const router = express.Router();
const SellerApprovalController = require('../Controller/SellerApproval/SellerApprovalController');
const AuthMiddleware = require('../Middleware/AuthMiddleware');
const upload = require('../Config/multerConfig');

// All routes require admin authentication
router.get('/pending', AuthMiddleware.Auth, SellerApprovalController.GetPendingApprovals);
router.get('/approved', AuthMiddleware.Auth, SellerApprovalController.GetApprovedSellers);
router.get('/reel-applications', SellerApprovalController.GetSellerReelApplications);
router.get('/reel-applications-test', SellerApprovalController.GetSellerReelApplications);
router.post('/approve', SellerApprovalController.ApproveSeller);
router.post('/reject', SellerApprovalController.RejectSeller);

// Add missing endpoints that frontend expects
router.get('/all', AuthMiddleware.Auth, SellerApprovalController.GetApprovedSellers);
router.get('/all-public', SellerApprovalController.GetApprovedSellers);
// Added by Vaishanvi - New endpoint to fetch approved sellers from seller_approvals table
router.get('/approved-from-approvals', SellerApprovalController.GetApprovedSellersFromApprovals);

class MockController {
  static GetAllSellers(req, res) {
    // For now, return the same data as approved sellers
    SellerApprovalController.GetApprovedSellers(req, res);
  }
  
  static GetAllCategories(req, res) {
    // This would need to be implemented properly
    res.status(501).json({
      success: false,
      message: 'Endpoint not implemented yet'
    });
  }
}

router.get('/categories', MockController.GetAllCategories);
router.get('/categories-public', MockController.GetAllCategories);

// Add the brand reel upload route
/**
 * @route   POST /SellerApproval/brand-reel-upload
 * @desc    Upload a new brand reel
 * @access  Private (Admin only)
 */
router.post('/brand-reel-upload', AuthMiddleware.Auth, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), SellerApprovalController.uploadBrandReel);

module.exports = router;
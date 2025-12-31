const express = require("express");
const router = express.Router();
const AuthMiddleware = require("../Middleware/AuthMiddleware");

const LoginController = require("../Controller/Users/LoginController");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../Config/db');
const UsersController = require("../Controller/Users/UsersController");

// Public routes
router.post("/Login", LoginController.Login);
router.post("/Signup", LoginController.Signup);
router.get("/", AuthMiddleware.verifyToken, UsersController.GetAllUsers); // Changed to verifyToken

// Alias routes for frontend compatibility
router.post("/User/Login", LoginController.Login);
router.post("/User/Signup", LoginController.Signup);

// Protected routes - User profile related (any authenticated user)
router.post("/Logout", AuthMiddleware.verifyToken, LoginController.Logout);
router.get("/me", AuthMiddleware.verifyToken, LoginController.GetCurrentUser);
router.put('/profile', AuthMiddleware.verifyToken, LoginController.UpdateMyProfile);
router.put('/change-password', AuthMiddleware.verifyToken, LoginController.ChangePassword);
router.get("/group/:groupId", AuthMiddleware.verifyToken, UsersController.GetUserGroupPermissions);

// Protected routes - Admin only
router.post("/add", AuthMiddleware.Auth, UsersController.AddUser);
router.get("/get/:id", AuthMiddleware.Auth, UsersController.GetUserById);
router.put("/update/:id", AuthMiddleware.Auth, UsersController.UpdateUser);
router.delete("/delete/:id", AuthMiddleware.Auth, UsersController.DeleteUser);

// Profile image upload storage
const profileDir = path.join(process.cwd(), 'uploads', 'profile');
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, profileDir); },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname || '.png');
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});
const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true); else cb(new Error('Only image files allowed'));
  }
});

// Upload and save profile image path
router.post('/profile/image', AuthMiddleware.verifyToken, uploadProfile.single('profileImage'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const userId = req.user.id;
    const relativePath = `/uploads/profile/${req.file.filename}`;
    const q = 'UPDATE oc_admin_user SET image = ? WHERE user_id = ?';
    db.query(q, [relativePath, userId], (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Failed to save image: ' + err.message });
      res.json({ success: true, message: 'Profile image updated', imagePath: relativePath });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Temporary route for testing
router.get("/test", (req, res) => {
  res.json({ message: "Users router is working" });
});

module.exports = router;
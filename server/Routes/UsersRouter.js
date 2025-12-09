const express = require("express");
const router = express.Router();
const AuthMiddleware = require("../Middleware/AuthMiddleware");

const LoginController = require("../Controller/Users/LoginController");
const UsersController = require("../Controller/Users/UsersController");

// Public routes
router.post("/Login", LoginController.Login);
router.post("/Signup", LoginController.Signup);
router.get("/", AuthMiddleware.Auth, UsersController.GetAllUsers); // Make this route protected

// Alias routes for frontend compatibility
router.post("/User/Login", LoginController.Login);
router.post("/User/Signup", LoginController.Signup);

// Protected routes
router.post("/Logout", AuthMiddleware.Auth, LoginController.Logout);
router.get("/me", AuthMiddleware.Auth, LoginController.GetCurrentUser);
router.post("/add", AuthMiddleware.Auth, UsersController.AddUser);
router.get("/get/:id", AuthMiddleware.Auth, UsersController.GetUserById);
router.put("/update/:id", AuthMiddleware.Auth, UsersController.UpdateUser);
router.get("/group/:groupId", AuthMiddleware.Auth, UsersController.GetUserGroupPermissions);

// Temporary route for testing
router.get("/test", (req, res) => {
  res.json({ message: "Users router is working" });
});

module.exports = router;
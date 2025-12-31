const express = require("express");
const router = express.Router();
const AuthMiddleware = require("../Middleware/AuthMiddleware");

const UserGroupsController = require("../Controller/Users/UserGroupsController");

// Protected routes - Admin only (for creating, updating, deleting)
router.post("/add", AuthMiddleware.Auth, UserGroupsController.AddUserGroup);
router.put("/:id", AuthMiddleware.Auth, UserGroupsController.UpdateUserGroup);
router.delete("/:id", AuthMiddleware.Auth, UserGroupsController.DeleteUserGroup);
router.delete("/", AuthMiddleware.Auth, UserGroupsController.DeleteUserGroups);

// Public routes for authenticated users (for reading user group info for sidebar filtering)
router.get("/", AuthMiddleware.verifyToken, UserGroupsController.GetUserGroups);
router.get("/:id", AuthMiddleware.verifyToken, UserGroupsController.GetUserGroupById);

module.exports = router;
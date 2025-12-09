const express = require("express");
const router = express.Router();
const AuthMiddleware = require("../Middleware/AuthMiddleware");

const UserGroupsController = require("../Controller/Users/UserGroupsController");

// Protected routes
router.post("/add", AuthMiddleware.Auth, UserGroupsController.AddUserGroup);
router.get("/", AuthMiddleware.Auth, UserGroupsController.GetUserGroups);
router.get("/:id", AuthMiddleware.Auth, UserGroupsController.GetUserGroupById);
router.put("/:id", AuthMiddleware.Auth, UserGroupsController.UpdateUserGroup);
router.delete("/:id", AuthMiddleware.Auth, UserGroupsController.DeleteUserGroup);
router.delete("/", AuthMiddleware.Auth, UserGroupsController.DeleteUserGroups);

module.exports = router;
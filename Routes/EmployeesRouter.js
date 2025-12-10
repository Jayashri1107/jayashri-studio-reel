const express = require("express");
const router = express.Router();
const AuthMiddleware = require("../Middleware/AuthMiddleware");

const EmployeesController = require("../Controller/Employees/EmployeesController");

// Employees routes
router.post("/CreateEmployee", AuthMiddleware.Auth, EmployeesController.CreateEmployee);
router.get("/GetEmployees", AuthMiddleware.Auth, EmployeesController.GetEmployees);

// Temporary route for testing
router.get("/test", AuthMiddleware.Auth, (req, res) => {
  res.json({ message: "Employees router is working" });
});

module.exports = router;


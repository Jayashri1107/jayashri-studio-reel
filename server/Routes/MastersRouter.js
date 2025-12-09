const express = require("express");
const router = express.Router();
const AuthMiddleware = require("../Middleware/AuthMiddleware");

const LocationsController = require("../Controller/Masters/LocationsController");

// Locations routes
router.post("/CreateLocation", AuthMiddleware.Auth, LocationsController.CreateLocation);
router.post("/DeleteLocation", AuthMiddleware.Auth, LocationsController.DeleteLocation);
router.get("/GetLocations", AuthMiddleware.Auth, LocationsController.GetLocations);
router.get("/GetLocationInfo", AuthMiddleware.Auth, LocationsController.GetLocationInfo);

// Temporary route for testing
router.get("/test", AuthMiddleware.Auth, (req, res) => {
  res.json({ message: "Masters router is working" });
});

module.exports = router;


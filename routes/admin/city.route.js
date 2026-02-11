const express = require("express");
const router = express.Router();

const cityController = require("../../controllers/admin/city.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create City
router.post("/createCity", cityController.createCity);

// Update City
router.patch("/updateCity", cityController.updateCity);

// Get All Countries
router.get("/getAllCities", cityController.getAllCities);

// Get All Cities ( dropdown )
router.get("/fetchCities", cityController.fetchCities);

// Delete City
router.delete("/deleteCity", cityController.deleteCity);

module.exports = router;

const express = require("express");
const router = express.Router();

const countryController = require("../../controllers/admin/country.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create Country
router.post("/createCountry", countryController.createCountry);

// Update Country
router.patch("/updateCountry", countryController.updateCountry);

// Get All Countries
router.get("/getAllCountries", countryController.getAllCountries);

// Get All Countries ( dropdown )
router.get("/fetchCountries", countryController.fetchCountries);

// Delete Country
router.delete("/deleteCountry", countryController.deleteCountry);

module.exports = router;

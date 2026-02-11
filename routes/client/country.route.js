const express = require("express");
const router = express.Router();

const countryController = require("../../controllers/client/country.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get All Countries
router.get("/fetchCountryList", countryController.fetchCountryList);

module.exports = router;

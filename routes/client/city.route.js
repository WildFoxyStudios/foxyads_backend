const express = require("express");
const router = express.Router();

const cityController = require("../../controllers/client/city.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get All Cities
router.get("/fetchCityList", cityController.fetchCityList);

module.exports = router;

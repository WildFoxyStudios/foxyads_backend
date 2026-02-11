const express = require("express");
const router = express.Router();

const stateController = require("../../controllers/client/state.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get All Countries
router.get("/fetchStateList", stateController.fetchStateList);

module.exports = router;

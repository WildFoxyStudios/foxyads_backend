const express = require("express");
const router = express.Router();

const settingController = require("../../controllers/client/setting.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get setting
router.get("/retrieveSystemConfig", settingController.retrieveSystemConfig);

module.exports = router;

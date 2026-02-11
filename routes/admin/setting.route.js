const express = require("express");
const router = express.Router();

const settingController = require("../../controllers/admin/setting.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Update setting
router.patch("/modifySetting", settingController.modifySetting);

// Toggle setting switch
router.patch("/modifyToggleOption", settingController.modifyToggleOption);

// Get setting
router.get("/retrieveSetting", settingController.retrieveSetting);

module.exports = router;

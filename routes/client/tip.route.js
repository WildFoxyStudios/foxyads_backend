const express = require("express");
const router = express.Router();
const tipController = require("../../controllers/client/tip.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get all tips
router.get("/listHelpfulHints", tipController.listHelpfulHints);

module.exports = router;

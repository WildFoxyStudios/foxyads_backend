const express = require("express");
const router = express.Router();
const tipController = require("../../controllers/admin/tip.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create a new tip
router.post("/createTip", tipController.createTip);

// Get all tips
router.get("/getAllTips", tipController.getAllTips);

// Update a tip
router.patch("/updateTip", tipController.updateTip);

// Delete a tip
router.delete("/deleteTip", tipController.deleteTip);

// Toggle isActive status of a tip
router.patch("/toggleTipActiveStatus", tipController.toggleTipActiveStatus);

module.exports = router;

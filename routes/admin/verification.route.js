const express = require("express");
const router = express.Router();
const verificationController = require("../../controllers/admin/verification.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get verification requests by status (pending, approved, rejected)
router.get("/getVerifications", verificationController.getVerifications);

// Approve a verification request
router.patch("/approveVerification", verificationController.approveVerification);

// Reject a verification request
router.patch("/rejectVerification", verificationController.rejectVerification);

module.exports = router;

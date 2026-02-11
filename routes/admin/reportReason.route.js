const express = require("express");
const router = express.Router();

const reportReasonController = require("../../controllers/admin/reportReason.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create a new report reason
router.post("/createReportReason", reportReasonController.createReportReason);

// Update an existing report reason
router.patch("/updateReportReason", reportReasonController.updateReportReason);

// Get all report reasons
router.get("/getReportReasons", reportReasonController.getReportReasons);

// Delete report reason
router.delete("/deleteReportReason", reportReasonController.deleteReportReason);

module.exports = router;

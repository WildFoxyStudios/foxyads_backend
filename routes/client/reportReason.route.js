const express = require("express");
const router = express.Router();

const reportReasonController = require("../../controllers/client/reportReason.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get all report reasons
router.get("/fetchReportReasons", reportReasonController.fetchReportReasons);

module.exports = router;

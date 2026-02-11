const express = require("express");
const router = express.Router();

const reportController = require("../../controllers/admin/report.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get Reports by Status
router.get("/getReportsByStatus", reportController.getReportsByStatus);

// Mark a Report as Solved
router.patch("/solveReport", reportController.solveReport);

// Delete the report
router.delete("/deleteReport", reportController.deleteReport);

module.exports = router;

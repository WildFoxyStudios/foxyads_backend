const express = require("express");
const router = express.Router();
const dashboardController = require("../../controllers/admin/dashboard.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get dashboard count
router.get("/fetchAdminDashboardStats", dashboardController.fetchAdminDashboardStats);

// Get chart analytic ( ads )
router.get("/fetchChartData", dashboardController.fetchChartData);

// Get chart analytic ( user / seller )
router.get("/retrieveChartMetrics", dashboardController.retrieveChartMetrics);

// Get recent user
router.get("/fetchRecentUsers", dashboardController.fetchRecentUsers);

// Get latest ads
router.get("/listRecentAds", dashboardController.listRecentAds);

module.exports = router;

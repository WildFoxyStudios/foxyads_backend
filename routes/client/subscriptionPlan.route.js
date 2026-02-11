const express = require("express");
const router = express.Router();

const planCtrl = require("../../controllers/client/subscriptionPlan.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get All Subscription Plans
router.get("/fetchSubscriptionPlans", planCtrl.fetchSubscriptionPlans);

module.exports = router;

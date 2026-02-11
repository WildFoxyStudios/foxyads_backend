const express = require("express");
const router = express.Router();

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const planCtrl = require("../../controllers/admin/subscriptionPlan.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create Subscription Plan
router.post("/createSubscriptionPlan", upload.single("image"), planCtrl.createSubscriptionPlan);

// Get All Subscription Plans
router.get("/getAllSubscriptionPlans", planCtrl.getAllSubscriptionPlans);

// Update Subscription Plan
router.patch("/updateSubscriptionPlan", upload.single("image"), planCtrl.updateSubscriptionPlan);

// Delete Plan
router.delete("/deleteSubscriptionPlan", planCtrl.deleteSubscriptionPlan);

// Toggle Plan Active Status
router.patch("/toggleSubscriptionPlanStatus", planCtrl.toggleSubscriptionPlanStatus);

module.exports = router;

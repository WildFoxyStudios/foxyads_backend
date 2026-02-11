const express = require("express");
const router = express.Router();

const adViewController = require("../../controllers/client/adView.controller");

const verifyUserToken = require("../../middleware/verifyUserToken.middleware");

// Record a unique view for an ad
router.post("/recordAdView", verifyUserToken, adViewController.recordAdView);

// Get total views for a specific ad
router.get("/getAdViews", adViewController.getAdViews);

module.exports = router;

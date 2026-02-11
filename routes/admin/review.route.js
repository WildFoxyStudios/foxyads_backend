const express = require("express");
const router = express.Router();

const reviewCtrl = require("../../controllers/admin/review.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get Reviews
router.get("/listReviews", reviewCtrl.listReviews);

// Delete Review
router.delete("/removeReview", reviewCtrl.removeReview);

module.exports = router;

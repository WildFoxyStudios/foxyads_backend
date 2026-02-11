const express = require("express");
const router = express.Router();

const verifyUserToken = require("../../middleware/verifyUserToken.middleware");

const reviewController = require("../../controllers/client/review.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Give Review
router.post("/giveReview", verifyUserToken, reviewController.giveReview);

// Get Review
router.get("/retrieveReview", verifyUserToken, reviewController.retrieveReview);

module.exports = router;

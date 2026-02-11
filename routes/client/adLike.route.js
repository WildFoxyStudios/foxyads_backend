const express = require("express");
const router = express.Router();

const adLikeController = require("../../controllers/client/adLike.controller");

const verifyUserToken = require("../../middleware/verifyUserToken.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");
router.use(checkAccessWithSecretKey());

// Like/unlike ad
router.post("/toggleAdLike", verifyUserToken, adLikeController.toggleAdLike);

// Get all likes for an ad
router.get("/getLikesForAd", adLikeController.getLikesForAd);

// Get liked ads
router.get("/fetchLikedAdListingRecords", verifyUserToken, adLikeController.fetchLikedAdListingRecords);

module.exports = router;

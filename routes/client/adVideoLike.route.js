const express = require("express");
const router = express.Router();

const adVideoLikeController = require("../../controllers/client/adVideoLike.controller");

const verifyUserToken = require("../../middleware/verifyUserToken.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");
router.use(checkAccessWithSecretKey());

// Like/unlike ad video
router.post("/toggleAdVideoLike", verifyUserToken, adVideoLikeController.toggleAdVideoLike);

// Get all likes for a specific ad video
router.get("/getLikesForAdVideo", adVideoLikeController.getLikesForAdVideo);

module.exports = router;

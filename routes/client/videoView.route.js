const express = require("express");
const router = express.Router();

const videoViewController = require("../../controllers/client/videoView.controller");

const verifyUserToken = require("../../middleware/verifyUserToken.middleware");

// Record a unique view for a video
router.post("/recordVideoView", verifyUserToken, videoViewController.recordVideoView);

module.exports = router;

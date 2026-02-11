const express = require("express");
const router = express.Router();

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const adVideoCtrl = require("../../controllers/client/adVideo.controller");
const verifyUserToken = require("../../middleware/verifyUserToken.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Upload adVideo
router.post(
  "/uploadAdVideo",
  verifyUserToken,
  upload.fields([
    { name: "videoUrl", maxCount: 1 },
    { name: "thumbnailUrl", maxCount: 1 },
  ]),
  adVideoCtrl.uploadAdVideo
);

// Get adVideos
router.get("/getAdVideos", adVideoCtrl.getAdVideos);

// Fetch ad videos for a specific seller
router.get("/getAdVideosOfSeller", verifyUserToken, adVideoCtrl.getAdVideosOfSeller);

// Delete adVideo
router.delete("/deleteAdVideo", verifyUserToken, adVideoCtrl.deleteAdVideo);

// Update adVideo
router.patch(
  "/updateAdVideo",
  verifyUserToken,
  upload.fields([
    { name: "videoUrl", maxCount: 1 },
    { name: "thumbnailUrl", maxCount: 1 },
  ]),
  adVideoCtrl.updateAdVideo
);

module.exports = router;

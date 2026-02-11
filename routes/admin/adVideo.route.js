const express = require("express");
const router = express.Router();

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const adVideoCtrl = require("../../controllers/admin/adVideo.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Upload adVideo
router.post(
  "/addAdVideo",
  upload.fields([
    { name: "videoUrl", maxCount: 1 },
    { name: "thumbnailUrl", maxCount: 1 },
  ]),
  adVideoCtrl.addAdVideo
);

// Get adVideos
router.get("/retrieveAdVideos", adVideoCtrl.retrieveAdVideos);

// Delete adVideo
router.delete("/discardAdVideo", adVideoCtrl.discardAdVideo);

// Update adVideo
router.patch(
  "/modifyAdVideo",
  upload.fields([
    { name: "videoUrl", maxCount: 1 },
    { name: "thumbnailUrl", maxCount: 1 },
  ]),
  adVideoCtrl.modifyAdVideo
);

module.exports = router;

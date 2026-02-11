const express = require("express");
const router = express.Router();

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const bannerCtrl = require("../../controllers/admin/banner.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create attributes
router.post("/addBanner", upload.single("image"), bannerCtrl.addBanner);

// Get attributes
router.get("/fetchAllBanners", bannerCtrl.fetchAllBanners);

// Update attribute
router.patch("/updateBannerById", upload.single("image"), bannerCtrl.updateBannerById);

// Toggle banner active status
router.patch("/toggleBannerStatus", bannerCtrl.toggleBannerStatus);

// Delete attribute
router.delete("/removeBannerById", bannerCtrl.removeBannerById);

module.exports = router;

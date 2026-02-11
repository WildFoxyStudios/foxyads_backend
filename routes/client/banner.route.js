const express = require("express");
const router = express.Router();

const bannerCtrl = require("../../controllers/client/banner.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get all banners
router.get("/retrieveBannerList", bannerCtrl.retrieveBannerList);

module.exports = router;

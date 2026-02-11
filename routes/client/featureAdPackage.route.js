const express = require("express");
const router = express.Router();

const featureAdPackageCtrl = require("../../controllers/client/featureAdPackage.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get All Feature Ad Packages
router.get("/fetchFeaturedAdPackages", featureAdPackageCtrl.fetchFeaturedAdPackages);

module.exports = router;

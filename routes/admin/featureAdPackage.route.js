const express = require("express");
const router = express.Router();

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const featureAdPackageCtrl = require("../../controllers/admin/featureAdPackage.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create Feature Advertisement Package
router.post("/createFeatureAdPackage", upload.single("image"), featureAdPackageCtrl.createFeatureAdPackage);

// Get All Feature Ad Packages
router.get("/getAllFeatureAdPackages", featureAdPackageCtrl.getAllFeatureAdPackages);

// Update Feature Advertisement Package
router.patch("/updateFeatureAdPackage", upload.single("image"), featureAdPackageCtrl.updateFeatureAdPackage);

// Delete Feature Ad Package
router.delete("/deleteFeatureAdPackage", featureAdPackageCtrl.deleteFeatureAdPackage);

// Toggle Active Status of Package
router.patch("/toggleFeatureAdPackageStatus", featureAdPackageCtrl.toggleFeatureAdPackageStatus);

module.exports = router;

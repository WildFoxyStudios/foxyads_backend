const express = require("express");
const router = express.Router();

const adListingCtrl = require("../../controllers/admin/adListing.controller");

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");
router.use(checkAccessWithSecretKey());

// Get All adListings
router.get("/getAllAdListings", adListingCtrl.getAllAdListings);

// Approve Or Reject adListing
router.patch("/updateAdListingStatus", adListingCtrl.updateAdListingStatus);

// Update adListing's isActive status
router.patch("/toggleAdListingStatus", adListingCtrl.toggleAdListingStatus);

// Update adListing
router.patch(
  "/modifyAdListing",
  upload.fields([
    { name: "primaryImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  adListingCtrl.modifyAdListing
);

// Delete adListing
router.delete("/deleteAdListing", adListingCtrl.deleteAdListing);

// Get all ad listings with optional search ( At the time of create adVideo )
router.get("/listAdListings", adListingCtrl.listAdListings);

module.exports = router;

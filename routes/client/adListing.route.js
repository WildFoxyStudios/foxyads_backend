const express = require("express");
const router = express.Router();

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const adListingCtrl = require("../../controllers/client/adListing.controller");
const verifyUserToken = require("../../middleware/verifyUserToken.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create Ad listing
router.post(
  "/createAdListing",
  verifyUserToken,
  upload.fields([
    { name: "primaryImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  adListingCtrl.createAdListing
);

// Get Seller's All adListings
router.get("/fetchAdListingRecords", verifyUserToken, adListingCtrl.fetchAdListingRecords);

// Get category wise adListings ( main category / loweset category wise ) ( search ) ( sort ) ( filter )
router.post("/fetchCategoryWiseAdListings", adListingCtrl.fetchCategoryWiseAdListings);

// Get most liked adListings ( Home )
router.get("/fetchMostLikedAdListings", adListingCtrl.fetchMostLikedAdListings);

// Get popular adListings ( Home )
router.get("/fetchPopularAdListingRecords", adListingCtrl.fetchPopularAdListingRecords);

// Get auction adListings ( Home )
router.get("/fetchAuctionAdListings", adListingCtrl.fetchAuctionAdListings);

// Get related adListings
router.get("/fetchAdsByRelatedCategory", adListingCtrl.fetchAdsByRelatedCategory);

// Update adListing
router.patch(
  "/updateAdListing",
  verifyUserToken,
  upload.fields([
    { name: "primaryImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  adListingCtrl.updateAdListing
);

// Delete adListing
router.delete("/removeAdListing", verifyUserToken, adListingCtrl.removeAdListing);

// Get seller's adListings ( At Upload Video )
router.get("/getSellerProductsBasicInfo", verifyUserToken, adListingCtrl.getSellerProductsBasicInfo);

// Get seller's adListings
router.get("/getAdListingsOfSeller", verifyUserToken, adListingCtrl.getAdListingsOfSeller);

// Get details of a particular ad
router.get("/fetchAdDetailsById", adListingCtrl.fetchAdDetailsById);

// Promote multiple ads for a seller based on their latest FeatureAdPackage purchase
router.patch("/promoteAds", verifyUserToken, adListingCtrl.promoteAds);

module.exports = router;

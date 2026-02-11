const express = require("express");
const router = express.Router();

const auctionBidCtrl = require("../../controllers/admin/auctionBid.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get bids placed by a specific user
router.get("/fetchUserBids", auctionBidCtrl.fetchUserBids);

// Get bids received by a specific seller
router.get("/fetchSellerAuctionBids", auctionBidCtrl.fetchSellerAuctionBids);

// Get all bids for a specific ad
router.get("/fetchBidsByAd", auctionBidCtrl.fetchBidsByAd);

module.exports = router;

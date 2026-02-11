const express = require("express");
const router = express.Router();

const auctionBidCtrl = require("../../controllers/client/auctionBid.controller");

const verifyUserToken = require("../../middleware/verifyUserToken.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Place manual auction bid
router.post("/placeManualBid", verifyUserToken, auctionBidCtrl.placeManualBid);

// Get bids placed by a specific user
router.get("/listBidsByUser", verifyUserToken, auctionBidCtrl.listBidsByUser);

// Get bids received by a specific seller
router.get("/listAuctionBidsBySeller", verifyUserToken, auctionBidCtrl.listAuctionBidsBySeller);

// Get all bids for a specific ad
router.get("/getAdWiseBids", auctionBidCtrl.getAdWiseBids);

module.exports = router;

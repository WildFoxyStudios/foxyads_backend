const express = require("express");
const router = express.Router();
const PurchaseHistoryController = require("../../controllers/client/purchaseHistory.controller");

const verifyUserToken = require("../../middleware/verifyUserToken.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create a new purchase history entry
router.post("/createPurchaseHistory", verifyUserToken, PurchaseHistoryController.createPurchaseHistory);

// Get User Purchase History
router.get("/getPurchaseHistory", verifyUserToken, PurchaseHistoryController.getPurchaseHistory);

module.exports = router;

const express = require("express");
const router = express.Router();
const PurchaseHistoryController = require("../../controllers/admin/purchaseHistory.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get purchase history
router.get("/listPurchaseHistory", PurchaseHistoryController.listPurchaseHistory);

module.exports = router;

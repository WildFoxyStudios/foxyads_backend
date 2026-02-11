const express = require("express");
const router = express.Router();
const currencyController = require("../../controllers/admin/currency.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create a new currency
router.post("/createCurrency", currencyController.createCurrency);

// Update an existing currency
router.patch("/updateCurrency", currencyController.updateCurrency);

// Get all currencies
router.get("/getAllCurrencies", currencyController.getAllCurrencies);

// Set a currency as default
router.patch("/setDefaultCurrency", currencyController.setDefaultCurrency);

// Delete a currency
router.delete("/deleteCurrency", currencyController.deleteCurrency);

module.exports = router;

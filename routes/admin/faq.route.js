const express = require("express");
const router = express.Router();
const faqController = require("../../controllers/admin/faq.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create a new FAQ
router.post("/createFAQ", faqController.createFAQ);

// Get all FAQs
router.get("/getAllFAQs", faqController.getAllFAQs);

// Update a FAQ
router.patch("/updateFAQ", faqController.updateFAQ);

// Delete a FAQ
router.delete("/deleteFAQ", faqController.deleteFAQ);

module.exports = router;

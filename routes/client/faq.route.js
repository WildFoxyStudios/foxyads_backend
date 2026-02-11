const express = require("express");
const router = express.Router();
const faqController = require("../../controllers/client/faq.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get all FAQs
router.get("/retrieveFAQList", faqController.retrieveFAQList);

module.exports = router;

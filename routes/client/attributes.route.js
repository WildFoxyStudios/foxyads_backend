const express = require("express");
const router = express.Router();

const attributesCtrl = require("../../controllers/client/attributes.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get attributes by Category ID
router.get("/fetchCategoryAttributes", attributesCtrl.fetchCategoryAttributes);

// Get attributes by Multiple Category IDs ( filter )
router.get("/fetchAttributesByCategories", attributesCtrl.fetchAttributesByCategories);

module.exports = router;

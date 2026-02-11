const express = require("express");
const router = express.Router();

const categoryCtrl = require("../../controllers/client/category.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get All Categories
router.get("/retrieveCategoryList", categoryCtrl.retrieveCategoryList);

// Get Subcategories by Category ID
router.get("/fetchSubcategoriesByParent", categoryCtrl.fetchSubcategoriesByParent);

// Get hierarchical category
router.get("/getHierarchicalCategories", categoryCtrl.getHierarchicalCategories);

module.exports = router;

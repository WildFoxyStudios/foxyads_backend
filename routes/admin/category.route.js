const express = require("express");
const router = express.Router();

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const categoryCtrl = require("../../controllers/admin/category.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create Category
router.post("/addCategory", upload.single("image"), categoryCtrl.addCategory);

// Update Category
router.patch("/modifyCategory", upload.single("image"), categoryCtrl.modifyCategory);

// Get All Categories
router.get("/fetchAllCategories", categoryCtrl.fetchAllCategories);

// Get Subcategories by Category ID
router.get("/getSubcategoriesByCategory", categoryCtrl.getSubcategoriesByCategory);

// Get hierarchical category
router.get("/getCategoryHierarchy", categoryCtrl.getCategoryHierarchy);

// Delete attribute
router.delete("/removeCategory", categoryCtrl.removeCategory);

// Toggle category active status
router.patch("/toggleCategoryStatus", categoryCtrl.toggleCategoryStatus);

module.exports = router;

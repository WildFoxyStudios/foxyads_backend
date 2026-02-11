const express = require("express");
const router = express.Router();

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const attributesCtrl = require("../../controllers/admin/attributes.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create attributes
router.post("/createAttributes", upload.single("image"), attributesCtrl.createAttributes);

// Get attributes
router.get("/getAllAttributes", attributesCtrl.getAllAttributes);

// Update attribute
router.patch("/updateAttribute", upload.single("image"), attributesCtrl.updateAttribute);

// Delete attribute
router.delete("/deleteAttribute", attributesCtrl.deleteAttribute);

// Get attributes by Category ID
router.get("/getAttributesByCategoryId", attributesCtrl.getAttributesByCategoryId);

// Delete attribute's values
router.delete("/deleteAttributeValue", attributesCtrl.deleteAttributeValues);

// Update attribute's values
router.patch("/updateAttributeValues", attributesCtrl.updateAttributeValues);

module.exports = router;

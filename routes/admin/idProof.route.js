const express = require("express");
const router = express.Router();

const IdProofController = require("../../controllers/admin/idProof.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create new IdProof
router.post("/createIdProof", IdProofController.createIdProof);

// Update IdProof
router.patch("/updateIdProof", IdProofController.updateIdProof);

// Get all IdProofs
router.get("/getAllIdProofs", IdProofController.getAllIdProofs);

// Delete IdProof
router.delete("/deleteIdProof", IdProofController.deleteIdProof);

// Toggle isActive status of an IdProof
router.patch("/toggleIdProofStatus", IdProofController.toggleIdProofStatus);

module.exports = router;

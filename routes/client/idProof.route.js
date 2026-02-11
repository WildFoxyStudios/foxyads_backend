const express = require("express");
const router = express.Router();

const IdProofController = require("../../controllers/client/idProof.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get all IdProofs
router.get("/listIdProofs", IdProofController.listIdProofs);

module.exports = router;

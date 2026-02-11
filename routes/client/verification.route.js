const express = require("express");
const router = express.Router();

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const verificationCtrl = require("../../controllers/client/verification.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

const verifyUserToken = require("../../middleware/verifyUserToken.middleware");

router.use(checkAccessWithSecretKey());

// Submit user verification
router.post(
  "/submitUserVerification",
  verifyUserToken,
  upload.fields([
    { name: "idProofFront", maxCount: 1 },
    { name: "idProofBack", maxCount: 1 },
  ]),
  verificationCtrl.submitUserVerification
);

// Get user verifiation status
router.get("/getVerificationStatus", verifyUserToken, verificationCtrl.getVerificationStatus);

module.exports = router;

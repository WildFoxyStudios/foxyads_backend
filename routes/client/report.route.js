const express = require("express");
const router = express.Router();

const verifyUserToken = require("../../middleware/verifyUserToken.middleware");

const reportController = require("../../controllers/client/report.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Report to ads
router.post("/reportAd", verifyUserToken, reportController.reportAd);

// Report to user
router.post("/reportUser", verifyUserToken, reportController.reportUser);

// Report to AdVideo
router.post("/reportAdVideo", verifyUserToken, reportController.reportAdVideo);

module.exports = router;

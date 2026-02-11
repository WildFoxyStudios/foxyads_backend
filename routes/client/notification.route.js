const express = require("express");
const router = express.Router();
const notificationController = require("../../controllers/client/notification.controller");

const verifyUserToken = require("../../middleware/verifyUserToken.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get notifications targeted to the current user, plus broadcasts (`sendType: 'all'`)
router.get("/getMyNotifications", verifyUserToken, notificationController.getMyNotifications);

// Clears user's own notifications
router.delete("/clearMyNotifications", verifyUserToken, notificationController.clearMyNotifications);

module.exports = router;

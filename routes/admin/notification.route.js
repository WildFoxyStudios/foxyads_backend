const express = require("express");
const router = express.Router();
const notificationController = require("../../controllers/admin/notification.controller");

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Send a notification to a specific user or all users
router.post("/broadcastAdminNotification", upload.single("image"), notificationController.broadcastAdminNotification);

// Send a notification to a specific user
router.post("/notifySingleUserByAdmin", upload.single("image"), notificationController.notifySingleUserByAdmin);

// Get All Notifications
router.get("/getAllNotifications", notificationController.getAllNotifications);

// Delete Notification
router.delete("/deleteNotification", notificationController.deleteNotification);

module.exports = router;

const express = require("express");
const router = express.Router();

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const userCtrl = require("../../controllers/admin/user.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get Users
router.get("/getUserList", userCtrl.getUserList);

// Update user
router.patch("/editUserProfile", upload.single("profileImage"), userCtrl.editUserProfile);

// Toggle user's block status
router.patch("/updateUserBlockState", userCtrl.updateUserBlockState);

// Get Users ( at the time of send notification )
router.get("/retrieveUserList", userCtrl.retrieveUserList);

module.exports = router;

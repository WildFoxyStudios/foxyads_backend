const express = require("express");
const router = express.Router();

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const userCtrl = require("../../controllers/client/user.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

const validateAccessToken = require("../../middleware/validateAccessToken.middleware");
const verifyUserToken = require("../../middleware/verifyUserToken.middleware");

router.use(checkAccessWithSecretKey());

//check the user is exists or not
router.post("/verifyUserExistence", userCtrl.verifyUserExistence);

//user login and sign up
router.post("/loginOrSignupUser", validateAccessToken, upload.single("profileImage"), userCtrl.loginOrSignupUser);

//update user's profile
router.patch("/updateProfileInfo", verifyUserToken, upload.single("profileImage"), userCtrl.updateProfileInfo);

//get user's profile
router.get("/fetchUserProfile", verifyUserToken, userCtrl.fetchUserProfile);

//update password
router.patch("/resetCurrentPassword", verifyUserToken, userCtrl.resetCurrentPassword);

//set password ( forgot password )
router.patch("/initiatePasswordReset", userCtrl.initiatePasswordReset);

//toggling the user's permission status
router.patch("/manageUserPermission", verifyUserToken, userCtrl.manageUserPermission);

//delete user account
router.delete("/deactivateAccount", verifyUserToken, userCtrl.deactivateAccount);

module.exports = router;

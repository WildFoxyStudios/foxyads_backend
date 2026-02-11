const express = require("express");
const router = express.Router();
const followController = require("../../controllers/client/follow.controller");

const verifyUserToken = require("../../middleware/verifyUserToken.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Toggles follow/unfollow for a user
router.post("/toggleFollowStatus", verifyUserToken, followController.toggleFollowStatus);

// Retrieves lists like followers, following, friends
router.get("/getSocialConnections", verifyUserToken, followController.getSocialConnections);

module.exports = router;

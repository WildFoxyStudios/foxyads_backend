const express = require("express");
const router = express.Router();
const followController = require("../../controllers/admin/follow.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

//get the friend list (users who follow each other)
router.get("/listUserFriends", followController.listUserFriends);

//get the following list (users whom I follow)
router.get("/listUserFollowing", followController.listUserFollowing);

//get the followers list (users who follow me)
router.get("/listUserFollowers", followController.listUserFollowers);

module.exports = router;

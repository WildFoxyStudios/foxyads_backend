const express = require("express");
const router = express.Router();

const chatTopicCtrl = require("../../controllers/client/chatTopic.controller");

const verifyUserToken = require("../../middleware/verifyUserToken.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get chat thumb list
router.get("/getChatList", verifyUserToken, chatTopicCtrl.getChatList);

module.exports = router;

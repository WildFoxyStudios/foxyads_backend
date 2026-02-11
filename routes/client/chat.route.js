const express = require("express");
const router = express.Router();

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const chatCtrl = require("../../controllers/client/chat.controller");
const verifyUserToken = require("../../middleware/verifyUserToken.middleware");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Send product wise message ( image or audio )
router.post(
  "/sendChatMessage",
  verifyUserToken,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  chatCtrl.sendChatMessage
);

// Get old chat
router.get("/getChatHistory", verifyUserToken, chatCtrl.getChatHistory);

module.exports = router;

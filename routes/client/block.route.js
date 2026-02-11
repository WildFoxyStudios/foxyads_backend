const express = require("express");
const router = express.Router();

const blockController = require("../../controllers/client/block.controller");

const verifyUserToken = require("../../middleware/verifyUserToken.middleware");

// Block - Unblock User
router.post("/toggleBlockUser", verifyUserToken, blockController.toggleBlockUser);

// Get Blocked User
router.get("/getBlockedUsers", verifyUserToken, blockController.getBlockedUsers);

module.exports = router;

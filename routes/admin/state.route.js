const express = require("express");
const router = express.Router();

const stateController = require("../../controllers/admin/state.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create state
router.post("/createState", stateController.createState);

// Update State
router.patch("/updateState", stateController.updateState);

// Get All Countries
router.get("/getAllStates", stateController.getAllStates);

// Delete State
router.delete("/deleteState", stateController.deleteState);

// Get All States ( dropdown )
router.get("/fetchStates", stateController.fetchStates);

module.exports = router;

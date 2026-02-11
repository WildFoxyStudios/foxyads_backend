const express = require("express");
const router = express.Router();

const staffCtrl = require("../../controllers/admin/staff.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create Staff
router.post("/createStaff", staffCtrl.createStaff);

// Update Staff
router.patch("/updateStaff", staffCtrl.updateStaff);

// Toggle Staff Active Status
router.patch("/updateStaffActiveState", staffCtrl.updateStaffActiveState);

// Get All Staff
router.get("/getStaffList", staffCtrl.getStaffList);

// Delete Staff
router.delete("/deleteStaff", staffCtrl.deleteStaff);

// Login Staff
router.post("/loginStaff", staffCtrl.loginStaff);

module.exports = router;

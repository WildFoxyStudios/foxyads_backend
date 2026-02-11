const express = require("express");
const router = express.Router();

const roleCtrl = require("../../controllers/admin/role.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create Role
router.post("/createRole", roleCtrl.createRole);

// Update Role
router.patch("/updateRole", roleCtrl.updateRole);

// Get All Roles
router.get("/getRoles", roleCtrl.getRoles);

// Delete Role
router.delete("/deleteRole", roleCtrl.deleteRole);

// Get All Roles ( When Create Staff )
router.get("/listAvailableRoles", roleCtrl.listAvailableRoles);

// Toggle Role Active Status
router.patch("/updateRoleActiveState", roleCtrl.updateRoleActiveState);

module.exports = router;

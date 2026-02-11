//express
const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const AdminController = require("../../controllers/admin/admin.controller");

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

//verifyAdminAuthToken
const verifyAdminToken = require("../../middleware/verifyAdminToken.middleware");

//check admin registered or not
route.get("/verifyAdminRegistration", checkAccessWithSecretKey(), AdminController.verifyAdminRegistration);

//admin signUp
route.post("/handleAdminRegistration", checkAccessWithSecretKey(), AdminController.handleAdminRegistration);

//admin login
route.post("/authenticateAdmin", verifyAdminToken, checkAccessWithSecretKey(), AdminController.authenticateAdmin);

//update admin profile
route.patch("/modifyAdminProfile", verifyAdminToken, checkAccessWithSecretKey(), upload.single("image"), AdminController.modifyAdminProfile);

//get admin profile
route.get("/retrieveAdminDetails", verifyAdminToken, checkAccessWithSecretKey(), AdminController.retrieveAdminDetails);

//update password
route.patch("/updatePassword", verifyAdminToken, checkAccessWithSecretKey(), AdminController.updatePassword);

//set Password
route.patch("/initiatePasswordReset", verifyAdminToken, checkAccessWithSecretKey(), AdminController.initiatePasswordReset);

//verify email
route.get("/handleAdminEmailVerification", checkAccessWithSecretKey(), AdminController.handleAdminEmailVerification);

module.exports = route;

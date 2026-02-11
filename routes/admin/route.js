//express
const express = require("express");
const route = express.Router();

//verifyAdminAuthToken
const verifyAdminToken = require("../../middleware/verifyAdminToken.middleware");

//require admin's route.js
const admin = require("./admin.route");
const tip = require("./tip.route");
const faq = require("./faq.route");
const blog = require("./blog.route");
const currency = require("./currency.route");
const subscriptionPlan = require("./subscriptionPlan.route");
const featureAdPackage = require("./featureAdPackage.route");
const attributes = require("./attributes.route");
const category = require("./category.route");
const reportReason = require("./reportReason.route");
const banner = require("./banner.route");
const setting = require("./setting.route");
const verification = require("./verification.route");
const purchaseHistory = require("./purchaseHistory.route");
const country = require("./country.route");
const state = require("./state.route");
const city = require("./city.route");
const adListing = require("./adListing.route");
const report = require("./report.route");
const idProof = require("./idProof.route");
const review = require("./review.route");
const role = require("./role.route");
const staff = require("./staff.route");
const adVideo = require("./adVideo.route");
const notification = require("./notification.route");
const dashboard = require("./dashboard.route");
const auctionBid = require("./auctionBid.route");
const user = require("./user.route");
const follow = require("./follow.route");

//exports admin's route.js
route.use("/", admin);
route.use("/tip", verifyAdminToken, tip);
route.use("/faq", verifyAdminToken, faq);
route.use("/blog", verifyAdminToken, blog);
route.use("/currency", verifyAdminToken, currency);
route.use("/subscriptionPlan", verifyAdminToken, subscriptionPlan);
route.use("/featureAdPackage", verifyAdminToken, featureAdPackage);
route.use("/attributes", verifyAdminToken, attributes);
route.use("/category", verifyAdminToken, category);
route.use("/reportReason", verifyAdminToken, reportReason);
route.use("/banner", verifyAdminToken, banner);
route.use("/setting", verifyAdminToken, setting);
route.use("/verification", verifyAdminToken, verification);
route.use("/purchaseHistory", verifyAdminToken, purchaseHistory);
route.use("/country", verifyAdminToken, country);
route.use("/state", verifyAdminToken, state);
route.use("/city", verifyAdminToken, city);
route.use("/adListing", verifyAdminToken, adListing);
route.use("/report", verifyAdminToken, report);
route.use("/idProof", verifyAdminToken, idProof);
route.use("/review", verifyAdminToken, review);
route.use("/role", verifyAdminToken, role);
route.use("/staff", verifyAdminToken, staff);
route.use("/adVideo", verifyAdminToken, adVideo);
route.use("/notification", verifyAdminToken, notification);
route.use("/dashboard", verifyAdminToken, dashboard);
route.use("/auctionBid", verifyAdminToken, auctionBid);
route.use("/user", verifyAdminToken, user);
route.use("/follow", verifyAdminToken, follow);

module.exports = route;

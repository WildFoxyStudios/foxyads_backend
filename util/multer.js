const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Helper to ensure the upload folder exists
const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  filename: (req, file, callback) => {
    const filename = Date.now() + "-" + Math.floor(Math.random() * 10000) + path.extname(file.originalname);
    callback(null, filename);
  },

  destination: (req, file, callback) => {
    let folder = "uploads/others";

    if (req.baseUrl.includes("/category")) {
      folder = "uploads/category";
    } else if (req.baseUrl.includes("/banner")) {
      folder = "uploads/banner";
    } else if (req.baseUrl.includes("/blog")) {
      folder = "uploads/blog";
    } else if (req.baseUrl.includes("/attributes")) {
      folder = "uploads/attributes";
    } else if (req.baseUrl.includes("/adListing")) {
      folder = "uploads/adListing";
    } else if (req.baseUrl.includes("/user")) {
      folder = "uploads/user";
    } else if (req.baseUrl.includes("/subscriptionPlan")) {
      folder = "uploads/subscriptionPlan";
    } else if (req.baseUrl.includes("/featureAdPackage")) {
      folder = "uploads/featureAdPackage";
    } else if (req.baseUrl.includes("/adVideo")) {
      folder = "uploads/adVideo";
    } else if (req.baseUrl.includes("/verification")) {
      folder = "uploads/verification";
    }

    ensureDirExists(folder);
    callback(null, folder);
  },
});

module.exports = storage;

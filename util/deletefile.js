const fs = require("fs");
const path = require("path");

/**
 * Deletes a file safely from the nested upload structure.
 * Accepts either a full path or file object (with `.path` key from Multer).
 */
exports.deleteFile = (file) => {
  const filePath = typeof file === "string" ? file : file?.path;

  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🗑️ Deleted file: ${filePath}`);
  } else {
    console.warn(`⚠️ File not found: ${filePath}`);
  }
};

/**
 * Deletes multiple files (used for multi-field uploads like `videoImage`, `videoUrl`).
 */
exports.deleteFiles = (files) => {
  const keys = Object.keys(files || {});
  keys.forEach((key) => {
    files[key].forEach((file) => {
      exports.deleteFile(file);
    });
  });
};

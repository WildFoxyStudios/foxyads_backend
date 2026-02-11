const express = require("express");
const router = express.Router();
const blogController = require("../../controllers/admin/blog.controller");

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Create Blog
router.post("/createBlog", upload.single("image"), blogController.createBlog);

// Get All Blogs
router.get("/getAllBlogs", blogController.getAllBlogs);

// Get Single Blog by ID
router.get("/getBlogById", blogController.getBlogById);

// Update Blog
router.patch("/updateBlog", upload.single("image"), blogController.updateBlog);

// Toggle Trending Blog
router.patch("/toggleBlogTrendingStatus", blogController.toggleBlogTrendingStatus);

// Delete Blog
router.delete("/deleteBlog", blogController.deleteBlog);

module.exports = router;

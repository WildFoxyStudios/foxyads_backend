const express = require("express");
const router = express.Router();
const blogController = require("../../controllers/client/blog.controller");

const checkAccessWithSecretKey = require("../../checkAccess");

router.use(checkAccessWithSecretKey());

// Get All Blogs
router.get("/retrieveBlogList", blogController.retrieveBlogList);

// Get Single Blog by ID
router.get("/retrieveBlogPost", blogController.retrieveBlogPost);

// Get Trending Blog
router.get("/retrieveTrendingBlogPosts", blogController.retrieveTrendingBlogPosts);

module.exports = router;

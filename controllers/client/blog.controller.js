
const supabase = require("../../util/supabase");

// Get All Blogs
exports.retrieveBlogList = async (req, res) => {
  try {
    const { data: blogs, error } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ status: true, message: "Blogs fetched successfully.", data: blogs });
  } catch (error) {
    console.error("Fetch Blogs Error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Get Single Blog by ID
exports.retrieveBlogPost = async (req, res) => {
  try {
    const { blogId } = req.query;
    if (!blogId) return res.status(200).json({ status: false, message: "Blog ID is required." });

    const { data: blog, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', blogId)
      .single();

    if (error || !blog) return res.status(200).json({ status: false, message: "Blog not found." });

    return res.status(200).json({ status: true, message: "Single Blog fetched successfully.", data: blog });
  } catch (error) {
    console.error("Fetch Single Blog Error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Get Trending Blog
exports.retrieveTrendingBlogPosts = async (req, res) => {
  try {
    const { data: trendingBlogs, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('trending', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "Blogs fetched successfully.",
      data: trendingBlogs,
    });
  } catch (error) {
    console.error("Get Trending Blogs Error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

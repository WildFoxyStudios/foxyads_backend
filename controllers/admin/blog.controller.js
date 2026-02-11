const supabase = require("../../util/supabase");
const { deleteFile } = require("../../util/deletefile");

// Create Blog
exports.createBlog = async (req, res) => {
  try {
    const { title, slug, tags, description } = req.body;
    console.log("Received tags:", tags, "Type:", typeof tags);

    const image = req.file?.path || null;

    if (!title || !slug || !image || !tags) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "All required fields must be filled." });
    }

    let parsedTags = [];
    if (Array.isArray(tags)) {
      parsedTags = tags.map((tag) => tag.trim()).filter((tag) => tag);
    } else if (typeof tags === "string") {
      parsedTags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
    } else {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Invalid tags format." });
    }

    const { data: blog, error } = await supabase
      .from('blogs')
      .insert({
        title,
        slug,
        image,
        tags: parsedTags, // PostgreSQL array
        description,
        trending: false, // Default
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: true,
      message: "Blog created successfully.",
      data: { ...blog, _id: blog.id }
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.error("Create Blog Error:", error);
    res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Get All Blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const page = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: blogs, error, count } = await supabase
      .from('blogs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mappedBlogs = blogs.map(b => ({
      ...b,
      _id: b.id
    }));

    return res.status(200).json({
      status: true,
      message: "Blogs fetched successfully.",
      total: count,
      data: mappedBlogs
    });
  } catch (error) {
    console.error("Fetch Blogs Error:", error);
    res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Get Single Blog by ID
exports.getBlogById = async (req, res) => {
  try {
    const { blogId } = req.query;
    if (!blogId) return res.status(200).json({ status: false, message: "Blog ID required." });

    const { data: blog, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', blogId)
      .single();

    if (!blog) return res.status(200).json({ status: false, message: "Blog not found." });
    if (error) throw error;

    res.status(200).json({ status: true, data: { ...blog, _id: blog.id } });
  } catch (error) {
    console.error("Fetch Single Blog Error:", error);
    res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Update Blog
exports.updateBlog = async (req, res) => {
  try {
    const { blogId, title, slug, tags, description } = req.body;

    if (!blogId) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Blog ID is required." });
    }

    const { data: blog, error: fetchError } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', blogId)
      .single();

    if (!blog) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Blog not found." });
    }

    const updates = { updated_at: new Date() };
    if (title) updates.title = title;
    if (slug) updates.slug = slug;
    if (description) updates.description = description;

    if (tags) {
      updates.tags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
    }

    if (req.file) {
      if (blog.image) {
        deleteFile(blog.image);
      }
      updates.image = req.file.path;
    }

    const { data: updated, error } = await supabase
      .from('blogs')
      .update(updates)
      .eq('id', blogId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: true,
      message: "Blog updated successfully.",
      data: { ...updated, _id: updated.id }
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.error("Update Blog Error:", error);
    res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Delete Blog
exports.deleteBlog = async (req, res) => {
  try {
    const { blogId } = req.query;
    if (!blogId) return res.status(200).json({ status: false, message: "Blog ID required." });

    const { data: blog } = await supabase.from('blogs').select('*').eq('id', blogId).single();
    if (!blog) return res.status(200).json({ status: false, message: "Blog not found." });

    if (blog.image) {
      try {
        deleteFile(blog.image);
      } catch (e) {
        console.error("Error deleting blog image:", e);
      }
    }

    const { error } = await supabase.from('blogs').delete().eq('id', blogId);
    if (error) throw error;

    res.status(200).json({ status: true, message: "Blog deleted successfully." });
  } catch (error) {
    console.error("Delete Blog Error:", error);
    res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Toggle Trending Blog
exports.toggleBlogTrendingStatus = async (req, res) => {
  try {
    const { blogId } = req.query;

    const { data: blog } = await supabase
      .from('blogs')
      .select('trending') // assuming 'trending' column exists
      .eq('id', blogId)
      .single();

    if (!blog) {
      return res.status(200).json({ status: false, message: "Blog not found." });
    }

    const newStatus = !blog.trending;
    const { data: updated, error } = await supabase
      .from('blogs')
      .update({ trending: newStatus })
      .eq('id', blogId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: true,
      message: `Trending status updated to ${updated.trending}`,
      data: { ...updated, _id: updated.id },
    });
  } catch (error) {
    console.error("Toggle Blog Trending Error:", error);
    res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

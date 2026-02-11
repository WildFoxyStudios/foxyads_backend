
const supabase = require("../../util/supabase");

// Get All Categories
exports.retrieveCategoryList = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const from = (start - 1) * limit;
    const to = from + limit - 1;

    // Top-level categories (parent_id is null)
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, image')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mappedCategories = categories.map(c => ({
      _id: c.id,
      name: c.name,
      image: c.image
    }));

    res.status(200).json({
      status: true,
      message: "Categories retrieved successfully.",
      data: mappedCategories,
    });
  } catch (error) {
    console.error("Fetch Categories Error:", error);
    res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Get Subcategories by Category ID
exports.fetchSubcategoriesByParent = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const { parentId } = req.query;

    if (!parentId) {
      return res.status(200).json({ status: false, message: "parentId is required." });
    }

    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { data: subcategories, error } = await supabase
      .from('categories')
      .select('id, name, image, parent_id')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .range(from, to);

    if (error) throw error;

    const mappedSubcategories = subcategories.map(c => ({
      _id: c.id,
      name: c.name,
      image: c.image,
      parent: c.parent_id
    }));

    return res.status(200).json({
      status: true,
      message: "Subcategories fetched successfully.",
      data: mappedSubcategories,
    });
  } catch (error) {
    console.error("Get Subcategories Error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Get hierarchical category
exports.getHierarchicalCategories = async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, image, parent_id')
      .eq('is_active', true);

    if (error) throw error;

    // Build tree
    const categoryMap = {};
    categories.forEach(c => {
      categoryMap[c.id] = {
        _id: c.id,
        name: c.name,
        image: c.image,
        parent: c.parent_id,
        children: []
      };
    });

    const tree = [];
    categories.forEach(c => {
      if (c.parent_id && categoryMap[c.parent_id]) {
        categoryMap[c.parent_id].children.push(categoryMap[c.id]);
      } else if (!c.parent_id) {
        tree.push(categoryMap[c.id]);
      }
    });

    res.status(200).json({
      status: true,
      message: "Category hierarchy fetched successfully",
      data: tree,
    });
  } catch (error) {
    console.error("Hierarchy API Error:", error);
    res.status(500).json({
      status: false,
      message: "Failed to fetch category hierarchy",
      error: error.message,
    });
  }
};

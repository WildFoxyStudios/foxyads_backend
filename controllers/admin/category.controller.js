const supabase = require("../../util/supabase");
const { deleteFile } = require("../../util/deletefile");
const fs = require("fs");

// Create Category
exports.addCategory = async (req, res) => {
  try {
    const { name, slug, parent } = req.body;
    const image = req.file?.path || null;

    if (!name || !slug) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(200).json({ status: false, message: "Name and slug are required." });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        image,
        parent_id: parent || null,
        is_active: true, // Default
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ status: true, message: "Category added successfully.", data });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error("Add Category Error:", error);
    res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Update Category
exports.modifyCategory = async (req, res) => {
  try {
    const { categoryId, name, slug, parent, isActive } = req.body;

    if (!categoryId) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(200).json({ status: false, message: "categoryId is required." });
    }

    // Get existing to handle image
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (fetchError || !category) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(200).json({ status: false, message: "Category not found." });
    }

    const updates = { updated_at: new Date() };
    if (name) updates.name = name;
    if (slug) updates.slug = slug;
    if (parent !== undefined) updates.parent_id = parent || null;
    if (isActive !== undefined) updates.is_active = isActive === "true" || isActive === true;

    if (req.file) {
      if (category.image) deleteFile(category.image);
      updates.image = req.file.path;
    }

    const { data: updatedCategory, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ status: true, message: "Category updated successfully.", data: updatedCategory });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error("Update Category Error:", error);
    res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Get All Categories
exports.fetchAllCategories = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const from = (start - 1) * limit;
    const to = from + limit - 1;

    // Fetch top-level categories
    // For counts (subcategoryCount, customFieldCount), we might need raw SQL or separate queries 
    // since Supabase JS doesn't support complex aggregation easily on relation counts in one go without FKs setup perfectly.
    // Simplifying for now to basic fetch.

    // Using is_null for parent_id to get root categories
    const { data: categories, error, count } = await supabase
      .from('categories')
      .select('*, subcategories:categories!parent_id(count)', { count: 'exact' })
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Map response to match frontend expectation (subcategoryCount)
    const mappedCategories = categories.map(cat => ({
      ...cat,
      _id: cat.id, // Frontend might expect _id
      subcategoryCount: cat.subcategories ? cat.subcategories[0]?.count : 0,
      customFieldCount: 0 // Placeholder, requires querying attributes table
    }));

    res.status(200).json({
      status: true,
      message: "Categories retrieved successfully.",
      total: count,
      data: mappedCategories,
    });
  } catch (error) {
    console.error("Fetch Categories Error:", error);
    res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// Get Subcategories by Category ID
exports.getSubcategoriesByCategory = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { parentId } = req.query;

    if (!parentId) {
      return res.status(200).json({ status: false, message: "parentId is required." });
    }

    const { data: subcategories, error, count } = await supabase
      .from('categories')
      .select('*', { count: 'exact' })
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .range(from, to);

    if (error) throw error;

    const mapped = subcategories.map(c => ({
      ...c,
      _id: c.id
    }));

    return res.status(200).json({
      status: true,
      message: "Subcategories fetched successfully.",
      total: count,
      data: mapped,
    });
  } catch (error) {
    console.error("Get Subcategories Error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Get hierarchical category
exports.getCategoryHierarchy = async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, image, parent_id')
      .eq('is_active', true);

    if (error) throw error;

    const categoryMap = categories.reduce((acc, category) => {
      // Frontend expects _id and parent
      const cat = { ...category, _id: category.id, parent: category.parent_id };
      acc[cat.id] = { ...cat, children: [] };
      return acc;
    }, {});

    const tree = Object.values(categoryMap).reduce((acc, category) => {
      if (category.parent_id) {
        if (categoryMap[category.parent_id]) {
          categoryMap[category.parent_id].children.push(category);
        }
      } else {
        acc.push(category);
      }
      return acc;
    }, []);

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

// Delete Category
exports.removeCategory = async (req, res) => {
  try {
    const { categoryId } = req.query;
    if (!categoryId) return res.status(400).json({ status: false, message: "categoryId is required." });

    // Recursive fetch children not easily done in one Supabase call without function
    // For now, relies on DB cascade or simple flat delete if no children
    // TODO: Implement proper recursive deletion of images

    // Check availability
    const { data: category, error: fetchError } = await supabase.from('categories').select('*').eq('id', categoryId).single();
    if (!category) return res.status(200).json({ status: false, message: "Category not found." });

    if (category.image) deleteFile(category.image);

    // Delete category - Schema should handle cascade for subcats/ads if configured, 
    // otherwise we just delete this one.
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// Toggle category active status
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const { categoryId } = req.query;

    if (!categoryId) {
      return res.status(200).json({ status: false, message: "Category ID is required." });
    }

    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('is_active')
      .eq('id', categoryId)
      .single();

    if (!category) {
      return res.status(200).json({ status: false, message: "Category not found." });
    }

    const newStatus = !category.is_active;

    const { data: updatedCategory, error } = await supabase
      .from('categories')
      .update({ is_active: newStatus })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: `Category has been ${updatedCategory.is_active ? "activated" : "deactivated"}.`,
      data: updatedCategory,
    });
  } catch (error) {
    console.error("toggleCategoryStatus error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

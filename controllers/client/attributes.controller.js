
const supabase = require("../../util/supabase");

// Get attributes by Category ID
exports.fetchCategoryAttributes = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const { categoryId } = req.query;

    if (!categoryId) {
      return res.status(200).json({ status: false, message: "Category ID is required" });
    }

    const from = (start - 1) * limit;
    const to = from + limit - 1;

    // Attributes table uses snake_case?
    // Mongoose: categoryId. DB: category_id.
    // values (array) -> values

    const { data: attributes, error } = await supabase
      .from('attributes')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Map to camelCase if needed, but Supabase returns snake_case by default.
    // Let's allow snake_case or map it.
    // The previous controller returned Mongoose documents (camelCase usually).
    // Let's map to be safe.

    const mapped = attributes.map(a => ({
      _id: a.id,
      name: a.name,
      image: a.image,
      fieldType: a.field_type,
      values: a.values,
      minLength: a.min_length,
      maxLength: a.max_length,
      isRequired: a.is_required,
      isActive: a.is_active,
      categoryId: a.category_id,
      createdAt: a.created_at,
      updatedAt: a.updated_at
    }));

    return res.status(200).json({
      status: true,
      message: "Attributes fetched successfully",
      data: mapped,
    });
  } catch (error) {
    console.error("Error fetching attributes:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

// Get attributes by Multiple Category IDs ( filter )
exports.fetchAttributesByCategories = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    let { categoryId } = req.query;

    if (!categoryId) {
      return res.status(200).json({ status: false, message: "Category ID(s) is required" });
    }

    if (typeof categoryId === "string") {
      categoryId = categoryId.split(",").map((id) => id.trim());
    }

    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { data: attributes, error } = await supabase
      .from('attributes')
      .select('*')
      .in('category_id', categoryId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = attributes.map(a => ({
      _id: a.id,
      name: a.name,
      image: a.image,
      fieldType: a.field_type,
      values: a.values,
      minLength: a.min_length,
      maxLength: a.max_length,
      isRequired: a.is_required,
      isActive: a.is_active,
      categoryId: a.category_id,
      createdAt: a.created_at,
      updatedAt: a.updated_at
    }));

    return res.status(200).json({
      status: true,
      message: "Attributes fetched successfully for given categories",
      data: mapped,
    });
  } catch (error) {
    console.error("Error fetching attributes by categories:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

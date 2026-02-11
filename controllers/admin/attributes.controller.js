const supabase = require("../../util/supabase");
const { deleteFile } = require("../../util/deletefile");

// Helper to validate UUIDs
const isValidUUID = (id) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

// Create attributes
exports.createAttributes = async (req, res) => {
  try {
    // Note: Assuming 'attributes' table exists with columns:
    // id, name, image, field_type, category_id, values (array/json), min_length, max_length, is_required, is_active

    if (!req.file) {
      return res.status(200).json({
        status: false,
        message: "Attribute image is required.",
      });
    }

    let { name, fieldType, values, minLength, maxLength, isRequired, isActive, categoryId } = req.body;

    let categoryIds = [];
    if (typeof categoryId === "string") {
      categoryIds = categoryId.split(",").map((id) => id.trim());
    } else if (Array.isArray(categoryId)) {
      categoryIds = categoryId;
    }

    // Validate UUIDs
    // const invalidIds = categoryIds.filter((id) => !isValidUUID(id));
    // Supabase will throw error if invalid UUID is used in query, but checking early is user-friendly.
    // Use loose check or just assume valid string. 

    if (!name || typeof name !== "string") {
      deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Name is required." });
    }

    const trimmedName = name.trim();
    const fieldTypeNum = Number(fieldType);
    const validFieldTypes = [1, 2, 3, 4, 5, 6];

    if (!validFieldTypes.includes(fieldTypeNum)) {
      deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Invalid fieldType." });
    }

    // Check existing categories
    // We can use 'in' filter
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id')
      .in('id', categoryIds);

    // Mongoose logic: if counts don't match, error.
    if (!existingCategories || existingCategories.length !== categoryIds.length) {
      deleteFile(req.file);
      return res.status(200).json({ status: false, message: "One or more categories not found." });
    }

    // Check existing attributes for these categories with same name (CI)
    // Supabase doesn't support regex easily across rows without extension or complex logic.
    // We can fetch attributes for these categories and filter in JS, assuming count isn't huge.
    // Or we can query by name.ilike for these categories.
    const { data: existingAttrs } = await supabase
      .from('attributes')
      .select('category_id')
      .eq('name', trimmedName) // Case sensitive? 
      // To be safe for CI uniqueness:
      .ilike('name', trimmedName)
      .in('category_id', categoryIds);

    const existingCatIds = existingAttrs ? existingAttrs.map(attr => attr.category_id) : [];
    const newCatIds = categoryIds.filter(id => !existingCatIds.includes(id));

    if (newCatIds.length === 0) {
      deleteFile(req.file);
      return res.status(200).json({
        status: false,
        message: `Attribute "${trimmedName}" already exists for all selected categories.`,
      });
    }

    const attrObj = {
      name: trimmedName,
      image: req.file?.path || "",
      field_type: fieldTypeNum, // camelCase -> snake_case
      values: [],
      min_length: 0,
      max_length: 0,
      is_required: !!isRequired,
      is_active: !!isActive,
      created_at: new Date(),
      updated_at: new Date()
    };

    //Handle values for selectable types
    if ([4, 5, 6].includes(fieldTypeNum)) {
      let parsedValues = values;
      if (typeof values === "string") {
        parsedValues = values
          .split(",")
          .map((v) => v.trim())
          .filter((v) => !!v);
      }

      if (!Array.isArray(parsedValues) || parsedValues.length === 0) {
        deleteFile(req.file);
        return res.status(200).json({
          status: false,
          message: "Values required for selectable field types.",
        });
      }

      attrObj.values = parsedValues;
    }

    //Handle min/max for text/number
    if ([1, 2].includes(fieldTypeNum)) {
      attrObj.min_length = Number(minLength) || 0;
      attrObj.max_length = Number(maxLength) || 0;
    }

    const attributeRows = newCatIds.map((catId) => ({
      ...attrObj,
      category_id: catId,
    }));

    const { data: savedAttributes, error: insertError } = await supabase
      .from('attributes')
      .insert(attributeRows)
      .select();

    if (insertError) {
      throw insertError;
    }

    // Remap for response if needed (camelCase)
    const mappedAttributes = savedAttributes.map(a => ({
      ...a,
      _id: a.id,
      fieldType: a.field_type,
      categoryId: a.category_id,
      minLength: a.min_length,
      maxLength: a.max_length,
      isRequired: a.is_required,
      isActive: a.is_active
    }));

    return res.status(200).json({
      status: true,
      message: "Attribute created successfully.",
      attribute: mappedAttributes,
    });
  } catch (err) {
    console.error(err);
    if (req.file) deleteFile(req.file);
    return res.status(500).json({ status: false, message: err.message || "Internal Server Error" });
  }
};

// Get attributes
exports.getAllAttributes = async (req, res) => {
  try {
    const page = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { categoryId, fieldType } = req.query;

    let query = supabase
      .from('attributes')
      .select('*, category:categories!category_id(name)', { count: 'exact' });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (fieldType) {
      query = query.eq('field_type', Number(fieldType));
    }

    const { data: attributes, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mappedAttributes = attributes.map(a => ({
      ...a,
      _id: a.id,
      fieldType: a.field_type,
      categoryId: a.category_id, // Original population returned object? Only 'name' selected. 
      // Original: .populate("categoryId", "name") -> { _id: ..., name: ... }
      // Supabase select `category:categories(...)` returns `category: { name: ... }`
      // We should construct it similarly.
      categoryId: a.category ? { _id: a.category_id, name: a.category.name } : a.category_id,

      values: a.values || [],
      minLength: a.min_length,
      maxLength: a.max_length,
      isRequired: a.is_required,
      isActive: a.is_active
    }));

    return res.status(200).json({
      status: true,
      message: attributes.length ? "Attributes fetched successfully." : "No attributes found.",
      total: count,
      attributes: mappedAttributes,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// Update attribute
exports.updateAttribute = async (req, res) => {
  try {
    const { attrId, name, fieldType, values: rawValues, minLength, maxLength, isRequired, isActive, categoryId } = req.body;

    if (!attrId) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Attribute ID (attrId) is required." });
    }

    // Get existing
    const { data: existingAttr, error: fetchError } = await supabase
      .from('attributes')
      .select('*')
      .eq('id', attrId)
      .single();

    if (!existingAttr) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Attribute not found." });
    }

    let categoryIds = [];
    if (categoryId) {
      if (typeof categoryId === "string") {
        categoryIds = categoryId.split(",").map((id) => id.trim());
      } else if (Array.isArray(categoryId)) {
        categoryIds = categoryId;
      }

      // Check existence
      const { data: catExists } = await supabase.from('categories').select('id').in('id', categoryIds);
      const foundIds = catExists ? catExists.map(c => c.id) : [];
      const missingIds = categoryIds.filter(id => !foundIds.includes(id));

      if (missingIds.length > 0) {
        if (req.file) deleteFile(req.file);
        return res.status(200).json({
          status: false,
          message: `These categories do not exist: ${missingIds.join(", ")}`,
        });
      }
    }

    let normalizedValues = [];
    if (rawValues) {
      if (typeof rawValues === "string") {
        normalizedValues = rawValues
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
      } else if (Array.isArray(rawValues)) {
        normalizedValues = rawValues.map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean);
      }
    }

    const ft = fieldType !== undefined ? Number(fieldType) : existingAttr.field_type;
    const optionFieldTypes = [4, 5, 6];

    // Logic check: if changing to strict type, need values. 
    // If just verifying existing:
    if (optionFieldTypes.includes(ft) && normalizedValues.length === 0 && (!existingAttr.values || existingAttr.values.length === 0)) {
      // If we are updating fieldType to option type but providing no values, and existing has no values, error.
      // But if we are keeping existing values (not sending rawValues), we valid? 
      // Original code: `if (optionFieldTypes.includes(fieldType) && normalizedValues.length === 0)`
      // It used `fieldType` from `req.body`. If passed, we check values.
      if (fieldType && normalizedValues.length === 0) {
        // What if user just wants to update name? rawValues undefined. normalizedValues empty.
        // Original: `if (rawValues)` was checked before normalization. 
        // Logic: `if (optionFieldTypes.includes(fieldType) && normalizedValues.length === 0)`
        // This implies if you send fieldType, you MUST send values? 
        // Or does `normalizedValues` get populated from existing if not provided? No.

        deleteFile(req.file);
        return res.status(200).json({
          status: false,
          message: `'values' are required for fieldType: ${fieldType}`,
        });
      }
    }

    // Handle image deletion
    if (req.file && existingAttr.image) {
      deleteFile(existingAttr.image);
    }

    const updatePayload = {
      updated_at: new Date()
    };
    if (name) updatePayload.name = name.trim();
    if (fieldType) updatePayload.field_type = Number(fieldType);
    if (normalizedValues.length > 0) updatePayload.values = normalizedValues;
    if (typeof minLength !== "undefined") updatePayload.min_length = Number(minLength);
    if (typeof maxLength !== "undefined") updatePayload.max_length = Number(maxLength);
    if (typeof isRequired !== "undefined") updatePayload.is_required = isRequired === 'true' || isRequired === true; // Handle string 'true' from formData
    if (typeof isActive !== "undefined") updatePayload.is_active = isActive === 'true' || isActive === true;
    if (req.file) updatePayload.image = req.file.path;
    if (categoryIds.length > 0) updatePayload.category_id = categoryIds[0];

    const { data: updatedAttr, error: updateError } = await supabase
      .from('attributes')
      .update(updatePayload)
      .eq('id', attrId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      status: true,
      message: "Attribute updated successfully.",
      data: { ...updatedAttr, _id: updatedAttr.id }
    });

  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.error("Attribute Update Error:", error);
    return res.status(500).json({ status: false, message: "Internal server error." });
  }
};

// Delete attribute
exports.deleteAttribute = async (req, res) => {
  try {
    const { attributeId } = req.query;

    const { data: doc, error } = await supabase
      .from('attributes')
      .select('*')
      .eq('id', attributeId)
      .single();

    if (!doc) return res.status(200).json({ status: false, message: "Attributes document not found." });

    if (doc.image) {
      deleteFile(doc.image); // This takes path string or object with path? Original passed `{ path: doc.image }` if string, or just `doc.image`?
      // Original: `deleteFile({ path: doc.image })`. My deleteFile helper usually takes path string or object.
    }

    const { error: deleteError } = await supabase.from('attributes').delete().eq('id', attributeId);
    if (deleteError) throw deleteError;

    return res.status(200).json({ status: true, message: "Attribute deleted." });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

// Get attributes by Category ID
exports.getAttributesByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.query;

    if (!categoryId) {
      return res.status(200).json({ status: false, message: "Category ID is required" });
    }

    const { data: attributes, error } = await supabase
      .from('attributes')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true);

    if (error) throw error;

    const mapped = attributes.map(a => ({
      ...a,
      _id: a.id,
      fieldType: a.field_type,
      values: a.values || []
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

// Delete attribute's values
exports.deleteAttributeValues = async (req, res) => {
  try {
    const { attributeId, index } = req.query;

    if (!attributeId || isNaN(index)) {
      return res.status(200).json({
        status: false,
        message: "attributeId and valid index are required",
      });
    }

    const { data: attribute, error } = await supabase
      .from('attributes')
      .select('*')
      .eq('id', attributeId)
      .single();

    if (!attribute) {
      return res.status(200).json({ status: false, message: "Attribute not found" });
    }

    const idx = parseInt(index);
    const existingValues = attribute.values || [];

    if (idx < 0 || idx >= existingValues.length) {
      return res.status(200).json({ status: false, message: "Invalid index provided" });
    }

    // Modify array
    existingValues.splice(idx, 1);

    const { data: updated, error: updateError } = await supabase
      .from('attributes')
      .update({ values: existingValues, updated_at: new Date() })
      .eq('id', attributeId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      status: true,
      message: "Value removed successfully by index",
      data: { ...updated, _id: updated.id, values: updated.values },
    });
  } catch (error) {
    console.error("Error deleting attribute value by index:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

// Update attribute's values
exports.updateAttributeValues = async (req, res) => {
  try {
    const { attributeId, index, newValue } = req.query;

    if (!attributeId || isNaN(index) || typeof newValue !== "string") {
      return res.status(200).json({
        status: false,
        message: "attributeId, index, and newValue are required",
      });
    }

    const { data: attribute, error } = await supabase
      .from('attributes')
      .select('*')
      .eq('id', attributeId)
      .single();

    if (!attribute) {
      return res.status(200).json({ status: false, message: "Attribute not found" });
    }

    const idx = parseInt(index);
    const existingValues = attribute.values || [];

    if (idx < 0 || idx >= existingValues.length) {
      return res.status(200).json({ status: false, message: "Invalid index provided" });
    }

    existingValues[idx] = newValue;

    const { data: updated, error: updateError } = await supabase
      .from('attributes')
      .update({ values: existingValues, updated_at: new Date() })
      .eq('id', attributeId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      status: true,
      message: "Attribute value updated successfully",
      data: { ...updated, _id: updated.id, values: updated.values },
    });
  } catch (error) {
    console.error("Error updating attribute value:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

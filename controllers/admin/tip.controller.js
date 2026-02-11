const supabase = require("../../util/supabase");

// Create a new tip
exports.createTip = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(200).json({ status: false, message: "Description is required." });
    }

    const { data: tip, error } = await supabase
      .from('tips')
      .insert({
        description,
        is_active: true, // Default active? Schema will confirm. Mongoose default was usually false or true? Code didn't set it in create, schema default likely.
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: true,
      message: "Tip created successfully.",
      data: { ...tip, _id: tip.id, isActive: tip.is_active },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Get all tips
exports.getAllTips = async (req, res) => {
  try {
    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { data: tips, error, count } = await supabase
      .from('tips')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = tips.map(t => ({
      ...t,
      _id: t.id,
      isActive: t.is_active
    }));

    res.status(200).json({
      status: true,
      message: "Tips fetched successfully.",
      total: count,
      data: mapped,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Update a tip
exports.updateTip = async (req, res) => {
  try {
    const { tipId, description } = req.body;

    if (!tipId) {
      return res.status(200).json({ status: false, message: "Tip ID is required." });
    }

    const { data: tip } = await supabase.from('tips').select('id').eq('id', tipId).single();
    if (!tip) {
      return res.status(200).json({ status: false, message: "Tip not found." });
    }

    const updates = { updated_at: new Date() };
    if (description) updates.description = description;

    const { data: updated, error } = await supabase
      .from('tips')
      .update(updates)
      .eq('id', tipId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: true,
      message: "Tip updated successfully.",
      data: { ...updated, _id: updated.id, isActive: updated.is_active },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Delete a tip
exports.deleteTip = async (req, res) => {
  try {
    const { tipId } = req.query;

    if (!tipId) {
      return res.status(200).json({ status: false, message: "Tip ID is required." });
    }

    const { data: tip } = await supabase.from('tips').select('id').eq('id', tipId).single();
    if (!tip) {
      return res.status(200).json({ status: false, message: "Tip not found." });
    }

    const { error } = await supabase.from('tips').delete().eq('id', tipId);
    if (error) throw error;

    res.status(200).json({
      status: true,
      message: "Tip deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Toggle isActive status of a tip
exports.toggleTipActiveStatus = async (req, res) => {
  try {
    const { tipId } = req.query;

    if (!tipId) {
      return res.status(200).json({ status: false, message: "Tip ID is required." });
    }

    const { data: tip } = await supabase.from('tips').select('id, is_active').eq('id', tipId).single();
    if (!tip) {
      return res.status(200).json({ status: false, message: "Tip not found." });
    }

    const { data: updated, error } = await supabase
      .from('tips')
      .update({ is_active: !tip.is_active })
      .eq('id', tipId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: true,
      message: `Tip is now ${updated.is_active ? "active" : "inactive"}.`,
      data: { ...updated, _id: updated.id, isActive: updated.is_active },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

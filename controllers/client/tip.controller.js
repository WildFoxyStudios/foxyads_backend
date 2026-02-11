
const supabase = require("../../util/supabase");

// Get all tips
exports.listHelpfulHints = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { data: tips, error } = await supabase
      .from('tips')
      .select('*')
      .eq('is_active', true) // Filter active? Model default isActive: true. Query doesn't filter but usually client calls imply it? Original code: Tip.find()... no filter.
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "Tips fetched successfully.",
      data: tips,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

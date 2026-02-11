
const supabase = require("../../util/supabase");

// Get all report reasons
exports.fetchReportReasons = async (req, res) => {
  try {
    const { start = 1, limit = 20 } = req.query;

    const parsedPage = parseInt(start);
    const parsedLimit = parseInt(limit);
    const from = (parsedPage - 1) * parsedLimit;
    const to = from + parsedLimit - 1;

    const { data: reportReasons, error } = await supabase
      .from('report_reasons')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "Report reasons retrieved successfully.",
      data: reportReasons,
    });
  } catch (error) {
    console.error("Get Error:", error);
    return res.status(500).json({ status: false, message: "Internal server error.", error: error.message });
  }
};

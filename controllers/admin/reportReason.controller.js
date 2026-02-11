const supabase = require("../../util/supabase");

// Create a new report reason
exports.createReportReason = async (req, res) => {
  try {
    const { title } = req.query; // Code used req.query for create?? Usually req.body but respecting existing logic. 
    // Wait, create usually uses body. Let's check original code line 6: const { title } = req.query;
    // Okay, I will stick to req.query if that's what the frontend sends, but check req.body too just in case?
    // Frontend likely sends params.

    const reasonTitle = title || req.body.title; // Fallback

    if (!reasonTitle || !reasonTitle.trim()) {
      return res.status(200).json({ status: false, message: "Title is required." });
    }

    const { data: reportReason, error } = await supabase
      .from('report_reasons')
      .insert({
        title: reasonTitle.trim(),
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "Report reason created successfully.",
      data: { ...reportReason, _id: reportReason.id },
    });
  } catch (error) {
    console.error("Create Error:", error);
    return res.status(500).json({ status: false, message: "Internal server error.", error: error.message });
  }
};

// Update an existing report reason
exports.updateReportReason = async (req, res) => {
  try {
    const { reportReasonId, title } = req.query; // Again query? Yes, original line 28.

    const reasonTitle = title || req.body.title;
    const id = reportReasonId || req.body.reportReasonId;

    if (!id) {
      return res.status(200).json({ status: false, message: "reportReasonId is required." });
    }

    // Check existence
    const { data: existing } = await supabase.from('report_reasons').select('id').eq('id', id).single();
    if (!existing) {
      return res.status(200).json({ status: false, message: "Report reason not found." });
    }

    const updates = { updated_at: new Date() };
    if (reasonTitle && reasonTitle.trim()) {
      updates.title = reasonTitle.trim();
    }

    const { data: updated, error } = await supabase
      .from('report_reasons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "Report reason updated successfully.",
      data: { ...updated, _id: updated.id },
    });
  } catch (error) {
    console.error("Update Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// Get all report reasons
exports.getReportReasons = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { data: reportReasons, error, count } = await supabase
      .from('report_reasons')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = reportReasons.map(r => ({
      ...r,
      _id: r.id
    }));

    return res.status(200).json({
      status: true,
      message: "Report reasons retrieved successfully.",
      total: count,
      data: mapped,
    });
  } catch (error) {
    console.error("Get Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// Delete report reason
exports.deleteReportReason = async (req, res) => {
  try {
    const { reportReasonId } = req.query;

    const id = reportReasonId || req.body.reportReasonId;

    if (!id) {
      return res.status(200).json({ status: false, message: "reportReasonId is required." });
    }

    const { data: existing } = await supabase.from('report_reasons').select('id').eq('id', id).single();
    if (!existing) {
      return res.status(200).json({ status: false, message: "Report reason not found." });
    }

    const { error } = await supabase.from('report_reasons').delete().eq('id', id);
    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "Report reason deleted successfully.",
      data: existing, // Original returned deleted doc, we return what we found implicitly
    });
  } catch (error) {
    console.error("Delete Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

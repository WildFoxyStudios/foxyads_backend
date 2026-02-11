const supabase = require("../../util/supabase");

// Get Reports by Status
exports.getReportsByStatus = async (req, res) => {
  try {
    const { status, startDate, endDate, reportType } = req.query;

    const numericStatus = Number(status);
    const numericReportType = Number(reportType);

    if (!numericStatus || ![1, 2].includes(numericStatus)) {
      return res.status(200).json({
        status: false,
        message: "Invalid or missing status. Use 1 for 'pending' or 2 for 'solved'.",
      });
    }

    if (!numericReportType) {
      return res.status(200).json({
        status: false,
        message: "Missing or invalid reportType. Must be a number.",
      });
    }

    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (start - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('reports')
      .select(`
        *,
        ad:ad_listings!ad_id(id, title, sub_title, description, primary_image),
        user:users!user_id(id, name, profile_id, profile_image),
        adVideo:ad_videos!ad_video_id(id, thumbnail_url, video_url, caption, shares)
      `, { count: 'exact' })
      .eq('status', numericStatus)
      .eq('report_type', numericReportType);

    // Note: 'report_type' and 'ad_video_id' etc mapping depends on schema. 
    // Mongoose 'adVideo' -> Supabase 'ad_videos' table likely.

    if (startDate && startDate !== "All" && endDate && endDate !== "All") {
      const startD = new Date(startDate).toISOString();
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      query = query.gte('created_at', startD).lte('created_at', endD.toISOString());
    }

    const { data: reports, error, count } = await query
      .order('created_at', { ascending: false }) // Mongoose used 'reportedAt', assuming 'created_at' is consistent
      .range(from, to);

    if (error) throw error;

    const mapped = reports.map(r => ({
      ...r,
      _id: r.id,
      ad: r.ad ? {
        title: r.ad.title,
        subTitle: r.ad.sub_title,
        description: r.ad.description,
        primaryImage: r.ad.primary_image
      } : null,
      user: r.user ? {
        name: r.user.name,
        profileId: r.user.profile_id,
        profileImage: r.user.profile_image
      } : null,
      adVideo: r.adVideo ? {
        thumbnailUrl: r.adVideo.thumbnail_url,
        videoUrl: r.adVideo.video_url,
        caption: r.adVideo.caption,
        shares: r.adVideo.shares
      } : null
    }));

    return res.status(200).json({
      status: true,
      message: `Reports with status '${numericStatus}' and reportType '${numericReportType}' fetched successfully.`,
      total: count,
      data: mapped,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ status: false, message: "Internal server error." });
  }
};

// Mark a Report as Solved
exports.solveReport = async (req, res) => {
  try {
    const { reportId } = req.query;

    if (!reportId) {
      return res.status(200).json({ status: false, message: "Invalid report ID." });
    }

    // Check current status first implies fetch
    const { data: report, error } = await supabase.from('reports').select('status').eq('id', reportId).single();
    if (!report) {
      return res.status(200).json({ status: false, message: "Report not found." });
    }

    if (report.status === 2) {
      return res.status(200).json({ status: false, message: "Report is already marked as solved." });
    }

    const { error: updateError } = await supabase
      .from('reports')
      .update({ status: 2, updated_at: new Date() })
      .eq('id', reportId);

    if (updateError) throw updateError;

    res.status(200).json({ status: true, message: "Report marked as solved successfully." });
  } catch (error) {
    console.error("Error solving report:", error);
    res.status(500).json({ status: false, message: "Internal server error." });
  }
};

// Delete the report
exports.deleteReport = async (req, res) => {
  try {
    const { reportId } = req.query;

    if (!reportId) {
      return res.status(200).json({ status: false, message: "Invalid report ID." });
    }

    const { data: report } = await supabase.from('reports').select('id').eq('id', reportId).single();
    if (!report) {
      return res.status(200).json({ status: false, message: "Report not found." });
    }

    const { error } = await supabase.from('reports').delete().eq('id', reportId);
    if (error) throw error;

    return res.status(200).json({ status: true, message: "Report deleted successfully." });
  } catch (error) {
    console.error("Error deleting report:", error);
    return res.status(500).json({ status: false, message: "Internal server error." });
  }
};

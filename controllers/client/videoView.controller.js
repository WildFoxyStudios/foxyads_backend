
const supabase = require("../../util/supabase");

// Record a unique view for a video
exports.recordVideoView = async (req, res) => {
  try {
    const { videoId } = req.query;
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = req.user.userId;
    if (!videoId) return res.status(200).json({ status: false, message: "Video ID is required" });

    // Try insert
    const { data, error } = await supabase
      .from('video_views')
      .insert({ video_id: videoId, user_id: userId })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(200).json({ status: false, message: "Video already viewed by user" });
      }
      throw error;
    }

    return res.status(200).json({ status: true, message: "Video view recorded", view: data });

  } catch (error) {
    console.error("Error recording video view:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

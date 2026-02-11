
const supabase = require("../../util/supabase");

// Like/unlike ad video
exports.toggleAdVideoLike = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = req.user.userId;
    const { adVideoId } = req.query;

    if (!adVideoId) {
      return res.status(200).json({ status: false, message: "Ad video ID is required" });
    }

    // Check existing
    const { data: existingLike } = await supabase
      .from('ad_video_likes')
      .select('*')
      .eq('ad_video_id', adVideoId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      await supabase.from('ad_video_likes').delete().eq('id', existingLike.id);
      return res.status(200).json({
        status: true,
        message: "Ad video unliked successfully",
        like: false,
      });
    }

    // Insert
    const { error } = await supabase.from('ad_video_likes').insert({
      ad_video_id: adVideoId,
      user_id: userId
    });

    if (error) throw error;

    res.status(200).json({
      status: true,
      message: "Ad video liked successfully",
      like: true,
    });
  } catch (error) {
    console.error("Error toggling ad video like:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Get all likes for a specific ad video
exports.getLikesForAdVideo = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const { adVideoId } = req.query;

    if (!adVideoId) return res.status(200).json({ status: false, message: "adVideoId is required" });

    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { data: likes, error } = await supabase
      .from('ad_video_likes')
      .select(`
            id,
            user:profiles(id, name, profile_image)
        `)
      .eq('ad_video_id', adVideoId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Map to match structure
    const mapped = likes.map(l => ({
      _id: l.id,
      user: {
        _id: l.user?.id,
        profileId: l.user?.id, // legacy
        name: l.user?.name,
        profileImage: l.user?.profile_image
      }
    }));

    return res.status(200).json({
      status: true,
      message: "Ad video likes fetched successfully",
      likes: mapped,
    });
  } catch (error) {
    console.error("Error fetching ad video likes:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

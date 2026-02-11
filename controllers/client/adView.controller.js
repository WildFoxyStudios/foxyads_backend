
const supabase = require("../../util/supabase");

// Record a unique view for an ad
exports.recordAdView = async (req, res) => {
  try {
    const { adId } = req.query;

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = req.user.userId;

    if (!adId) {
      return res.status(200).json({ status: false, message: "Ad ID is required" });
    }

    try {
      const { data: newView, error } = await supabase
        .from('ad_views')
        .insert({ ad_id: adId, user_id: userId })
        .select('*')
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint
          return res.status(200).json({ status: false, message: "Ad already viewed by user" });
        }
        throw error;
      }

      return res.status(200).json({ status: true, message: "Ad view recorded", view: newView });
    } catch (err) {
      throw err;
    }
  } catch (error) {
    console.error("Error recording ad view:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Get total views for a specific ad
exports.getAdViews = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const { adId } = req.query;

    if (!adId) return res.status(200).json({ status: false, message: "Ad ID is required" });

    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { data: adViews, error } = await supabase
      .from('ad_views')
      .select(`
            *,
            user:profiles!user_id(id, name, profile_image)
        `)
      .eq('ad_id', adId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = adViews.map(v => ({
      _id: v.id,
      user: {
        _id: v.user?.id,
        profileId: v.user?.id,
        name: v.user?.name,
        profileImage: v.user?.profile_image
      }
    }));

    return res.status(200).json({
      status: true,
      message: "Ad view fetched successfully.",
      adView: mapped,
    });
  } catch (error) {
    console.error("Error fetching ad views count:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

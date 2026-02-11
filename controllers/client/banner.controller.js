
const supabase = require("../../util/supabase");

// Get all banners
exports.retrieveBannerList = async (req, res) => {
  try {
    const { data: banners, error } = await supabase
      .from('banners')
      .select('image, redirect_url')
      .eq('is_active', true) // Default behavior usually active only, or all? Mongoose was find() all.
      // Assuming fetch all for now to match Mongoose .find()
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = banners.map(b => ({
      image: b.image,
      redirectUrl: b.redirect_url
    }));

    return res.status(200).json({ status: true, message: "Banners fetched successfully.", data: mapped });
  } catch (error) {
    console.error("retrieveBannerList error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

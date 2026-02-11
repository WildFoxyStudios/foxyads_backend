const supabase = require("../../util/supabase");
const { deleteFile } = require("../../util/deletefile");

// Get all banners
exports.fetchAllBanners = async (req, res) => {
  try {
    const page = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: banners, error, count } = await supabase
      .from('banners')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false }) // Use 'created_at' snake_case
      .range(from, to);

    if (error) throw error;

    const mappedBanners = banners.map(b => ({
      ...b,
      _id: b.id,
      redirectUrl: b.redirect_url, // snake_case to camelCase
      isActive: b.is_active
    }));

    return res.status(200).json({
      status: true,
      message: "Banners fetched successfully.",
      total: count,
      data: mappedBanners
    });
  } catch (error) {
    console.error("fetchAllBanners error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Create a new banner
exports.addBanner = async (req, res) => {
  try {
    const image = req.file?.path || "";
    const { redirectUrl } = req.body;

    if (!image) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Image is required." });
    }

    const { data: banner, error } = await supabase
      .from('banners')
      .insert({
        image: image,
        redirect_url: redirectUrl || "",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "Banner created successfully.",
      data: { ...banner, _id: banner.id, redirectUrl: banner.redirect_url, isActive: banner.is_active },
    });
  } catch (error) {
    if (req?.file) {
      deleteFile(req.file);
    }
    console.error("addBanner error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Update banner by ID
exports.updateBannerById = async (req, res) => {
  try {
    const { redirectUrl, bannerId } = req.body;
    const newImage = req.file?.path;

    if (!bannerId) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Banner ID is required." });
    }

    const { data: banner, error: fetchError } = await supabase
      .from('banners')
      .select('*')
      .eq('id', bannerId)
      .single();

    if (!banner) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Banner not found." });
    }

    const updates = { updated_at: new Date() };

    if (newImage && newImage !== banner.image) {
      if (banner.image) {
        deleteFile(banner.image);
      }
      updates.image = newImage;
    }

    if (redirectUrl !== undefined) updates.redirect_url = redirectUrl;

    const { data: updated, error: updateError } = await supabase
      .from('banners')
      .update(updates)
      .eq('id', bannerId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      status: true,
      message: "Banner updated successfully.",
      data: { ...updated, _id: updated.id, redirectUrl: updated.redirect_url, isActive: updated.is_active },
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.error("updateBannerById error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Delete banner by ID
exports.removeBannerById = async (req, res) => {
  try {
    const { bannerId } = req.query;

    if (!bannerId) {
      return res.status(200).json({ status: false, message: "Banner ID is required." });
    }

    const { data: banner, error } = await supabase
      .from('banners')
      .select('*')
      .eq('id', bannerId)
      .single();

    if (!banner) {
      return res.status(200).json({ status: false, message: "Banner not found." });
    }

    if (banner.image) {
      deleteFile(banner.image);
    }

    const { error: deleteError } = await supabase.from('banners').delete().eq('id', bannerId);
    if (deleteError) throw deleteError;

    return res.status(200).json({
      status: true,
      message: "Banner deleted successfully.",
    });
  } catch (error) {
    console.error("removeBannerById error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Toggle banner active status
exports.toggleBannerStatus = async (req, res) => {
  try {
    const { bannerId } = req.query;

    if (!bannerId) {
      return res.status(200).json({ status: false, message: "Banner ID is required." });
    }

    const { data: banner } = await supabase.from('banners').select('is_active').eq('id', bannerId).single();
    if (!banner) {
      return res.status(200).json({ status: false, message: "Banner not found." });
    }

    const newStatus = !banner.is_active;
    const { data: updated, error } = await supabase
      .from('banners')
      .update({ is_active: newStatus })
      .eq('id', bannerId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: `Banner has been ${updated.is_active ? "activated" : "deactivated"}.`,
      data: { ...updated, _id: updated.id, redirectUrl: updated.redirect_url, isActive: updated.is_active },
    });
  } catch (error) {
    console.error("toggleBannerStatus error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

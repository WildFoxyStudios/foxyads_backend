
const supabase = require("../../util/supabase");

// Get All Feature Ad Packages
exports.fetchFeaturedAdPackages = async (req, res) => {
  try {
    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { data: packages, error } = await supabase
      .from('feature_ad_packages')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = packages.map(p => ({
      _id: p.id,
      name: p.name,
      iosProductId: p.ios_product_id,
      price: p.price,
      discount: p.discount,
      finalPrice: p.final_price,
      image: p.image,
      description: p.description,
      days: p.days,
      advertisementLimit: p.advertisement_limit, // or map to 'advertisementLimit'? Mongoose: advertisementLimit.
      isActive: p.is_active,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));

    return res.status(200).json({
      status: true,
      message: "Feature ad packages fetched successfully.",
      data: mapped,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: `Failed to fetch packages: ${error.message}`,
    });
  }
};

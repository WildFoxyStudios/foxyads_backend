
const supabase = require("../../util/supabase");

// Get All Cities
exports.fetchCityList = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const from = (start - 1) * limit;
    const to = from + limit - 1;

    // Supabase returns count with header if requested, or we can do separate count query.
    // countDocuments() was used.

    const { data: cities, count, error } = await supabase
      .from('cities')
      .select('*, state:states(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = cities.map(c => ({
      _id: c.id,
      state_id: {
        _id: c.state_id,
        name: c.state?.name
      },
      name: c.name,
      latitude: c.latitude,
      longitude: c.longitude,
      createdAt: c.created_at,
      updatedAt: c.updated_at
    }));

    return res.status(200).json({
      status: true,
      message: "Cities retrieved successfully",
      total: count,
      data: mapped,
    });
  } catch (err) {
    console.error("Error fetching cities:", err);
    res.status(500).json({
      status: false,
      message: "Error fetching cities",
      error: err.message,
    });
  }
};

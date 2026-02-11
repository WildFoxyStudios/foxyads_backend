
const supabase = require("../../util/supabase");

// Get All States
exports.fetchStateList = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { data: states, count, error } = await supabase
      .from('states')
      .select('*, country:countries(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = states.map(s => ({
      _id: s.id,
      country_id: {
        _id: s.country_id,
        name: s.country?.name
      },
      name: s.name,
      state_code: s.state_code,
      latitude: s.latitude,
      longitude: s.longitude,
      type: s.type,
      createdAt: s.created_at,
      updatedAt: s.updated_at
    }));

    return res.status(200).json({
      status: true,
      message: "States retrieved successfully",
      total: count,
      data: mapped,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Error fetching states",
      error: err.message,
    });
  }
};

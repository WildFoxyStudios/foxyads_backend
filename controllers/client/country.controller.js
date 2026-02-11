
const supabase = require("../../util/supabase");

// Get All Countries
exports.fetchCountryList = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { data: countries, error } = await supabase
      .from('countries')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = countries.map(c => ({
      _id: c.id,
      name: c.name,
      phone_code: c.phone_code,
      currency: c.currency,
      currencyName: c.currency_name,
      currencySymbol: c.currency_symbol,
      tld: c.tld,
      native: c.native,
      region: c.region,
      subregion: c.subregion,
      nationality: c.nationality,
      latitude: c.latitude,
      longitude: c.longitude,
      emoji: c.emoji,
      emojiU: c.emoji_u,
      createdAt: c.created_at,
      updatedAt: c.updated_at
    }));

    return res.status(200).json({
      status: true,
      message: "Country retrieved successfully",
      data: mapped,
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: "Error fetching countries", error: err.message });
  }
};

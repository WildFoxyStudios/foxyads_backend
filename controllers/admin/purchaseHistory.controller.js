const supabase = require("../../util/supabase");

// Get purchase history
exports.listPurchaseHistory = async (req, res) => {
  try {
    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { startDate, endDate, userId } = req.query;

    let query = supabase
      .from('purchase_histories')
      .select('*, user:users!user_id(name, profile_image, profile_id)', { count: 'exact' });

    // Date Filters
    if (startDate && startDate !== "All" && endDate && endDate !== "All") {
      const startD = new Date(startDate).toISOString();
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      query = query.gte('created_at', startD).lte('created_at', endD.toISOString());
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Execute Main Query
    const { data: history, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Calculate Total Amount
    // We need a separate query for sum since Supabase REST API doesn't support aggregate sums directly with data.
    // Optimization: If no filters, maybe use a cached value or separate table? 
    // For now, we fetch all amounts matching filter.
    let amountQuery = supabase.from('purchase_histories').select('amount');

    if (startDate && startDate !== "All" && endDate && endDate !== "All") {
      const startD = new Date(startDate).toISOString();
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      amountQuery = amountQuery.gte('created_at', startD).lte('created_at', endD.toISOString());
    }
    if (userId) {
      amountQuery = amountQuery.eq('user_id', userId);
    }

    const { data: amounts, error: amountError } = await amountQuery;

    let totalAmount = 0;
    if (!amountError && amounts) {
      totalAmount = amounts.reduce((sum, row) => sum + (row.amount || 0), 0);
    }

    const mapped = history.map(h => ({
      ...h,
      _id: h.id,
      user: h.user ? { name: h.user.name, profileImage: h.user.profile_image, profileId: h.user.profile_id } : null
    }));

    return res.status(200).json({
      status: true,
      message: "Purchase history fetched successfully.",
      data: mapped,
      total: count,
      totalAmount,
    });
  } catch (error) {
    console.error("Error fetching purchase history:", error);
    return res.status(500).json({ status: false, message: "Failed to fetch purchase history." });
  }
};

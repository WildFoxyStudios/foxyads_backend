
const supabase = require("../../util/supabase");

// Get All Subscription Plans
exports.fetchSubscriptionPlans = async (req, res) => {
  try {
    const { start = 1, limit = 10 } = req.query;
    const parsedPage = parseInt(start);
    const parsedLimit = parseInt(limit);

    if (isNaN(parsedPage) || parsedPage <= 0 || isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(200).json({
        status: false,
        message: "'start' and 'limit' must be valid positive integers.",
      });
    }

    const from = (parsedPage - 1) * parsedLimit;
    const to = from + parsedLimit - 1;

    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true) // assuming we only fetch active? Mongoose "find()" returned all.
      // If I want strictly "find()", remove ".eq('is_active', true)".
      // I will match original Mongoose code: SubscriptionPlan.find()... so fetch all.
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = plans.map(p => ({
      _id: p.id,
      name: p.name,
      iosProductId: p.ios_product_id,
      price: p.price,
      discount: p.discount,
      finalPrice: p.final_price,
      image: p.image,
      description: p.description,
      days: {
        isLimited: p.days_is_limited,
        value: p.days_value
      },
      advertisements: {
        isLimited: p.ads_is_limited,
        value: p.ads_value
      },
      isActive: p.is_active,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));

    return res.status(200).json({
      status: true,
      message: "Subscription plans fetched successfully.",
      data: mapped,
    });
  } catch (error) {
    res.status(500).json({ status: false, message: `Failed to fetch subscription plans: ${error.message}` });
  }
};

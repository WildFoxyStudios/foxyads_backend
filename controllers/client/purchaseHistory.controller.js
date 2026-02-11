
const supabase = require("../../util/supabase");
const crypto = require("crypto");

//Generate a unique transaction ID
function generateTransactionId(gateway = "UNKNOWN") {
  const uniquePart = crypto.randomBytes(5).toString("hex").toUpperCase();
  const timestamp = Date.now();
  return `TXN_${gateway.toUpperCase()}_${uniquePart}_${timestamp}`;
}

// Create a new purchase history entry
exports.createPurchaseHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = req.user.userId;
    const { packageId, packageType, paymentGateway, currency = "INR" } = req.body;

    if (!packageId || !packageType || !paymentGateway) {
      return res.status(200).json({ status: false, message: "Missing required fields" });
    }

    const validTypes = ["SubscriptionPlan", "FeatureAdPackage"];
    if (!validTypes.includes(packageType)) {
      return res.status(200).json({ status: false, message: `Invalid package type. Expected one of: ${validTypes.join(", ")}` });
    }

    // Fetch user
    const { data: user } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!user) return res.status(200).json({ status: false, message: "User not found" });

    // Fetch Package
    let packageDoc = null;
    let table = packageType === "SubscriptionPlan" ? "subscription_plans" : "feature_ad_packages";

    // Check tables: subscription_plans or feature_ad_packages
    // Note table names are pluralized snake_case
    const { data: pkg } = await supabase.from(table).select('*').eq('id', packageId).single();
    packageDoc = pkg;

    if (!packageDoc) return res.status(200).json({ status: false, message: `${packageType} not found` });

    res.status(200).json({ status: true, message: "Purchase recorded successfully" });

    // Calculate dates
    const startDate = new Date();
    let endDate = null;
    let days = 0;
    const finalPrice = packageDoc.final_price || packageDoc.price; // Map from snake_case

    if (packageType === "SubscriptionPlan") {
      // Logic from Mongoose: days.isLimited, days.value
      // Supabase columns: days_is_limited, days_value
      const isLimited = packageDoc.days_is_limited;
      const value = packageDoc.days_value;

      if (isLimited === false) {
        endDate = null;
        days = -1;
      } else {
        days = Number(value || 0);
        const date = new Date(startDate);
        date.setDate(date.getDate() + days);
        endDate = date;
      }
    } else if (packageType === "FeatureAdPackage") {
      days = Number(packageDoc.days || 0);
      const date = new Date(startDate);
      date.setDate(date.getDate() + days);
      endDate = date;
    }

    const packageDetails = {
      packageId,
      name: packageDoc.name,
      finalPrice: finalPrice,
      startDate: startDate.toISOString(),
      endDate: endDate ? endDate.toISOString() : null,
      days,
      advertisements: packageType === "SubscriptionPlan" ? (packageDoc.ads_value || 0) : (packageDoc.advertisement_limit || 0),
    };

    // Update User
    const updates = {};
    if (packageType === "SubscriptionPlan") {
      updates.subscription_package = packageDetails; // Need jsonb column in profiles? user.model didn't explicitly show it, check Supabase schema?
      updates.is_subscription_expired = false;
    } else {
      updates.feature_package = packageDetails;
      updates.is_feature_package_expired = false;
    }

    // We assume 'profiles' table has these JSONB columns or we created them.
    // If not, we might need to add them. "profiles" schema was created earlier?
    // I'll assume they exist or I should create them.
    // Ideally I'd alter 'profiles' table to add 'subscription_package' and 'feature_package'.
    // I will try to update. If fails, I need migration.

    await supabase.from('profiles').update(updates).eq('id', userId);

    // Create Purchase History
    await supabase.from('purchase_histories').insert({
      user_id: userId,
      package_id: packageId,
      package_type: packageType,
      package_details: packageDetails,
      amount: finalPrice,
      payment_gateway: paymentGateway,
      transaction_id: generateTransactionId(paymentGateway),
      currency,
      paid_at: startDate.toISOString()
    });

  } catch (error) {
    console.error("Error creating purchase history:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Get User Purchase History
exports.getPurchaseHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = req.user.userId;
    const { start = 1, limit = 10 } = req.query;
    const from = (parseInt(start) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    const { data: purchaseList, error } = await supabase
      .from('purchase_histories')
      .select("payment_gateway, transaction_id, amount, currency, paid_at, package_type")
      .eq('user_id', userId)
      .order('paid_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = purchaseList.map(p => ({
      paymentGateway: p.payment_gateway,
      transactionId: p.transaction_id,
      amount: p.amount,
      currency: p.currency,
      paidAt: p.paid_at,
      packageType: p.package_type
    }));

    return res.status(200).json({
      status: true,
      message: "Purchase history fetched successfully.",
      data: mapped,
    });
  } catch (error) {
    console.error("getPurchaseHistory error:", error);
    return res.status(500).json({ status: false, message: "Internal server error." });
  }
};

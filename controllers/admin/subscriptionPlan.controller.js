const supabase = require("../../util/supabase");
const fs = require("fs");

// Create Subscription Plan
exports.createSubscriptionPlan = async (req, res) => {
  try {
    const { name, iosProductId, price, discount, finalPrice, description, daysIsLimited, daysValue, adsIsLimited, adsValue } = req.body;
    const image = req.file?.path;

    if (!name || !price || !discount || !finalPrice || !description || !image) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(200).json({ status: false, message: "All required fields must be provided." });
    }

    const { data, error } = await supabase
      .from('subscription_plans')
      .insert({
        name,
        ios_product_id: iosProductId,
        price,
        discount,
        final_price: finalPrice,
        image,
        description,
        days: {
          isLimited: daysIsLimited === "true",
          value: Number(daysValue) || 0,
        },
        advertisements: {
          isLimited: adsIsLimited === "true",
          value: Number(adsValue) || 0,
        },
        is_active: true, // Default active
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ status: true, message: "Subscription plan created.", data });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error("Create Plan Error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

// Get All Subscription Plans
exports.getAllSubscriptionPlans = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { data: plans, error, count } = await supabase
      .from('subscription_plans')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.status(200).json({
      status: true,
      message: "Subscription plans fetched successfully.",
      totalCount: count,
      data: plans,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: `Failed to fetch subscription plans: ${error.message}`,
    });
  }
};

// Update Subscription Plan
exports.updateSubscriptionPlan = async (req, res) => {
  try {
    const { planId } = req.body;
    const { name, iosProductId, price, discount, finalPrice, description, daysIsLimited, daysValue, adsIsLimited, adsValue } = req.body;

    if (!planId) return res.status(200).json({ status: false, message: "Plan ID required." });

    // Fetch existing plan to handle image replacement
    const { data: existingPlan, error: fetchError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (fetchError || !existingPlan) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(200).json({ status: false, message: "Plan not found." });
    }

    const updates = { updated_at: new Date() };
    if (name) updates.name = name;
    if (iosProductId) updates.ios_product_id = iosProductId;
    if (price) updates.price = price;
    if (discount) updates.discount = discount;
    if (finalPrice) updates.final_price = finalPrice;
    if (description) updates.description = description;

    // Handle nested JSON updates carefully - we need to merge or overwrite
    const currentDays = existingPlan.days || {};
    if (typeof daysIsLimited !== "undefined") currentDays.isLimited = daysIsLimited === "true";
    if (typeof daysValue !== "undefined") currentDays.value = Number(daysValue) || 0;
    if (Object.keys(currentDays).length > 0) updates.days = currentDays;

    const currentAds = existingPlan.advertisements || {};
    if (typeof adsIsLimited !== "undefined") currentAds.isLimited = adsIsLimited === "true";
    if (typeof adsValue !== "undefined") currentAds.value = Number(adsValue) || 0;
    if (Object.keys(currentAds).length > 0) updates.advertisements = currentAds;

    if (req.file) {
      if (existingPlan.image && fs.existsSync(existingPlan.image)) {
        fs.unlinkSync(existingPlan.image);
      }
      updates.image = req.file.path;
    }

    const { data: updatedPlan, error } = await supabase
      .from('subscription_plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ status: true, message: "Plan updated.", data: updatedPlan });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ status: false, message: error.message });
  }
};

// Delete Plan
exports.deleteSubscriptionPlan = async (req, res) => {
  try {
    const { planId } = req.query;
    if (!planId) return res.status(200).json({ status: false, message: "Plan ID required." });

    // Fetch to delete image
    const { data: plan, error: fetchError } = await supabase
      .from('subscription_plans')
      .select('image')
      .eq('id', planId)
      .single();

    if (plan && plan.image && fs.existsSync(plan.image)) {
      try { fs.unlinkSync(plan.image); } catch (e) { console.error("Error deleting image:", e); }
    }

    const { error } = await supabase.from('subscription_plans').delete().eq('id', planId);
    if (error) throw error;

    res.status(200).json({ status: true, message: "Plan deleted." });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// Toggle Plan Active Status
exports.toggleSubscriptionPlanStatus = async (req, res) => {
  try {
    const { planId } = req.query;
    if (!planId) return res.status(200).json({ status: false, message: "Plan ID required." });

    // Get current status first to toggle it
    const { data: plan, error: fetchError } = await supabase
      .from('subscription_plans')
      .select('is_active')
      .eq('id', planId)
      .single();

    if (fetchError || !plan) return res.status(200).json({ status: false, message: "Plan not found." });

    const newStatus = !plan.is_active;

    const { data: updatedPlan, error } = await supabase
      .from('subscription_plans')
      .update({ is_active: newStatus })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ status: true, message: `Plan status updated to ${newStatus}`, data: updatedPlan });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

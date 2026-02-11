const supabase = require("../../util/supabase");
const { deleteFile } = require("../../util/deletefile");

// Create Feature Advertisement Package
exports.createFeatureAdPackage = async (req, res) => {
  try {
    console.log("req.body: ", req.body);

    const { name, iosProductId, price, discount, finalPrice, description, days, advertisementLimit } = req.body;
    const image = req.file;

    if (!name || !price || !discount || !finalPrice || !description || !image || !days || !advertisementLimit) {
      if (image) deleteFile(image);
      return res.status(200).json({ status: false, message: "All required fields must be provided." });
    }

    const expectedFinal = Number(price) - (Number(price) * Number(discount)) / 100;
    const roundedFinal = Math.round(expectedFinal * 100) / 100;

    if (Number(finalPrice) !== roundedFinal) {
      deleteFile(image);
      return res.status(200).json({
        status: false,
        message: `Invalid final price. It should be: ${roundedFinal}`,
      });
    }

    const { data: newPackage, error } = await supabase
      .from('feature_ad_packages')
      .insert({
        name,
        ios_product_id: iosProductId,
        price: Number(price),
        discount: Number(discount),
        final_price: Number(finalPrice),
        image: image.path,
        description,
        days: Number(days),
        advertisement_limit: Number(advertisementLimit),
        is_active: true, // Default
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: true,
      message: "Feature advertisement package created successfully.",
      data: { ...newPackage, _id: newPackage.id, iosProductId: newPackage.ios_product_id, finalPrice: newPackage.final_price, advertisementLimit: newPackage.advertisement_limit, isActive: newPackage.is_active },
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    res.status(500).json({ status: false, message: error.message });
  }
};

// Update Feature Advertisement Package
exports.updateFeatureAdPackage = async (req, res) => {
  try {
    const { packageId, name, iosProductId, price, discount, finalPrice, description, days, advertisementLimit } = req.body;

    const { data: pkg } = await supabase.from('feature_ad_packages').select('*').eq('id', packageId).single();
    if (!pkg) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Package not found." });
    }

    // Validation logic for price logic if updated
    if (price && discount && finalPrice) {
      const expectedFinal = Number(price) - (Number(price) * Number(discount)) / 100;
      const roundedFinal = Math.round(expectedFinal * 100) / 100;
      if (Number(finalPrice) !== roundedFinal) {
        if (req.file) deleteFile(req.file);
        return res.status(200).json({
          status: false,
          message: `Invalid final price. It should be: ${roundedFinal}`,
        });
      }
    }

    const updates = { updated_at: new Date() };
    if (name) updates.name = name;
    if (iosProductId) updates.ios_product_id = iosProductId;
    if (price) updates.price = Number(price);
    if (discount) updates.discount = Number(discount);
    if (finalPrice) updates.final_price = Number(finalPrice);
    if (description) updates.description = description;
    if (days !== undefined) updates.days = Number(days);
    if (advertisementLimit !== undefined) updates.advertisement_limit = Number(advertisementLimit);

    if (req.file) {
      if (pkg.image) deleteFile({ path: pkg.image });
      updates.image = req.file.path;
    }

    const { data: updated, error } = await supabase
      .from('feature_ad_packages')
      .update(updates)
      .eq('id', packageId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: true,
      message: "Feature advertisement package updated successfully.",
      data: { ...updated, _id: updated.id, iosProductId: updated.ios_product_id, finalPrice: updated.final_price, advertisementLimit: updated.advertisement_limit, isActive: updated.is_active },
    });
  } catch (error) {
    console.log(error);
    if (req.file) deleteFile(req.file);
    res.status(500).json({ status: false, message: error.message });
  }
};

// Get All Feature Ad Packages
exports.getAllFeatureAdPackages = async (req, res) => {
  try {
    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { data: packages, error, count } = await supabase
      .from('feature_ad_packages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = packages.map(p => ({
      ...p,
      _id: p.id,
      iosProductId: p.ios_product_id,
      finalPrice: p.final_price,
      advertisementLimit: p.advertisement_limit,
      isActive: p.is_active
    }));

    res.status(200).json({
      status: true,
      message: "Feature ad packages fetched successfully.",
      totalCount: count,
      data: mapped,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: `Failed to fetch packages: ${error.message}`,
    });
  }
};

// Delete Feature Ad Package
exports.deleteFeatureAdPackage = async (req, res) => {
  try {
    const { packageId } = req.query;

    const { data: pkg } = await supabase.from('feature_ad_packages').select('*').eq('id', packageId).single();
    if (!pkg) {
      return res.status(200).json({ status: false, message: "Package not found." });
    }

    if (pkg.image) deleteFile({ path: pkg.image });

    const { error } = await supabase.from('feature_ad_packages').delete().eq('id', packageId);
    if (error) throw error;

    res.status(200).json({ status: true, message: "Package deleted successfully." });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// Toggle Active Status of Package
exports.toggleFeatureAdPackageStatus = async (req, res) => {
  try {
    const { packageId } = req.query;

    const { data: pkg } = await supabase.from('feature_ad_packages').select('is_active').eq('id', packageId).single();
    if (!pkg) {
      return res.status(200).json({ status: false, message: "Package not found." });
    }

    const { data: updated, error } = await supabase
      .from('feature_ad_packages')
      .update({ is_active: !pkg.is_active })
      .eq('id', packageId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: true,
      message: `Package status updated to ${updated.is_active ? "Active ✅" : "Inactive ❌"}.`,
      data: { ...updated, _id: updated.id, iosProductId: updated.ios_product_id, finalPrice: updated.final_price, advertisementLimit: updated.advertisement_limit, isActive: updated.is_active },
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

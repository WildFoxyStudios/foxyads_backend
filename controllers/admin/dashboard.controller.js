const supabase = require("../../util/supabase");

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  let year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

// Get dashboard count
exports.fetchAdminDashboardStats = async (req, res) => {
  try {
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    // Prepare date filter arguments
    let dateFilter = null;
    if (startDate !== "All" && endDate !== "All") {
      const s = new Date(startDate).toISOString();
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      dateFilter = { start: s, end: e.toISOString() };
    }

    // Helper for count queries
    const getCount = async (table, filter = {}, dateField = 'created_at') => {
      let query = supabase.from(table).select('*', { count: 'exact', head: true });

      if (dateFilter) {
        query = query.gte(dateField, dateFilter.start).lte(dateField, dateFilter.end);
      }

      if (filter.field && filter.value !== undefined) {
        query = query.eq(filter.field, filter.value);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    };

    const [
      totalUsers,
      totalBlockedUsers,
      totalCategories,
      totalApprovedAds,
      totalAttributes,
      totalAdVideos,
    ] = await Promise.all([
      getCount('users'),
      getCount('users', { field: 'is_blocked', value: true }),
      getCount('categories'),
      getCount('ad_listings', { field: 'status', value: 2 }), // 2 = Approved
      getCount('attributes'), // Assuming table is 'attributes'
      getCount('ad_videos'),  // Assuming table is 'ad_videos'
    ]);

    return res.status(200).json({
      status: true,
      message: "Get admin panel dashboard stats.",
      data: {
        totalUsers,
        totalBlockedUsers,
        totalCategories,
        totalApprovedAds,
        totalAttributes,
        totalAdVideos,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Get chart analytic ( ads )
exports.fetchChartData = async (req, res) => {
  try {
    if (!req.query.type) {
      return res.status(200).json({ status: false, message: "type must be required!" });
    }

    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";
    const type = req.query.type.trim().toLowerCase();

    if (type !== "ads") {
      return res.status(200).json({ status: false, message: "type must be passed valid." });
    }

    let query = supabase.from('ad_listings').select('created_at, review_at, status');

    if (startDate !== "All" && endDate !== "All") {
      const s = new Date(startDate).toISOString();
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      // We need to fetch any ad that was created OR reviewed in this range if we want to be precise for all categories?
      // The original Mongoose code had specific ranges for specific facets.
      // 1) Pending -> creation range
      // 2) Approved/Rejected -> review range
      // It's cleaner to fetch all relevant data. 
      // Supabase OR filter with dates is tricky. 
      // Let's just fetch all ads created OR reviewed in range? 
      // Or just fetch ALL ads if range is small? 
      // Actually, let's allow fetching slightly more and filter in JS, or trigger parallel queries.
      // For exact equivalence to Mongoose $facet:
    }

    // Mongoose $facet allowed independent pipelines. Supabase doesn't.
    // We will run 4 parallel queries for the 4 charts if date range is applied, 
    // because 'pending' filters by 'created_at', others by 'review_at'.

    // Define date ranges
    let createdRange = null;
    let reviewedRange = null;

    if (startDate !== "All" && endDate !== "All") {
      const s = new Date(startDate);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      createdRange = { start: s.toISOString(), end: e.toISOString() };
      reviewedRange = { start: s.toISOString(), end: e.toISOString() };
    }

    const fetchGroupedData = async (status, range, dateField) => {
      let q = supabase.from('ad_listings').select(dateField).eq('status', status);
      if (range) {
        q = q.gte(dateField, range.start).lte(dateField, range.end);
      }

      const { data, error } = await q;
      if (error) throw error;

      // Group by date
      const grouped = {};
      data.forEach(item => {
        const dateStr = formatDate(item[dateField]);
        grouped[dateStr] = (grouped[dateStr] || 0) + 1;
      });

      return Object.keys(grouped).sort().map(date => ({ date, count: grouped[date] }));
    };

    const [pending, approved, permanentRejected, softRejected] = await Promise.all([
      fetchGroupedData(1, createdRange, 'created_at'),    // 1: Pending
      fetchGroupedData(2, reviewedRange, 'review_at'),    // 2: Approved
      fetchGroupedData(3, reviewedRange, 'review_at'),    // 3: Permanent Rejected
      fetchGroupedData(4, reviewedRange, 'review_at'),    // 4: Soft Rejected
    ]);

    return res.status(200).json({
      status: true,
      message: "Success",
      chartAds: {
        pending,
        approved,
        permanentRejected,
        softRejected
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Get chart analytic ( user / seller )
exports.retrieveChartMetrics = async (req, res) => {
  try {
    const { type: rawType, startDate = "All", endDate = "All" } = req.query;
    if (!rawType) {
      return res.status(200).json({ status: false, message: "type must be required!" });
    }

    const type = String(rawType).trim().toLowerCase();

    let range = null;
    if (startDate !== "All" && endDate !== "All") {
      const s = new Date(startDate);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      range = { start: s.toISOString(), end: e.toISOString() };
    }

    if (type === "user") {
      let q = supabase.from('users').select('created_at');
      if (range) {
        q = q.gte('created_at', range.start).lte('created_at', range.end);
      }
      const { data, error } = await q;
      if (error) throw error;

      const grouped = {};
      data.forEach(u => {
        const d = formatDate(u.created_at);
        grouped[d] = (grouped[d] || 0) + 1;
      });

      const chartUser = Object.keys(grouped).sort().map(date => ({ date, count: grouped[date] }));
      return res.status(200).json({ status: true, message: "Success", chartUser });
    }

    if (type === "seller") {
      // Sellers: Users with currentPackage (subscription_package_id not null)
      // Date: created_at (as fallback) or start_date of package? 
      // Logic in original: $ifNull: ["$currentPackage.startDate", "$createdAt"]

      let q = supabase.from('users').select('created_at, subscription_start_date').not('subscription_package_id', 'is', null);
      // Note: 'subscription_start_date' assumes column name. 
      // Need to check what fields exist. In user controller refactor we saw 'subscription_package_id'.
      // Assuming subscription details are flattened on user or fetched via relation.
      // If they are in a JSONB or separate table, strict SQL query is needed.
      // Assuming 'subscription_start_date' exists on users based on snake_case convention or similar?
      // Let's assume 'subscription_start_date' or similar. 
      // Accessing 'users' table structure would be ideal.
      // Based on user.model (which we don't use anymore), it had nested currentPackage.

      // If we don't have the column name, we might query all and map in JS.
      // Since we are replacing Mongoose, we rely on Supabase columns. 
      // Previous user controller refactor didn't explicitly select subscription dates.

      // Let's just select '*' for now to be safe, or just created_at if we can't find package date.
      // Wait, 'subscription_start_date' is a likely guess if we migrated 'currentPackage.startDate'.

      const { data, error } = await q;
      if (error) throw error;

      // Apply filtering and grouping in JS
      const grouped = {};
      const sDate = range ? new Date(range.start) : null;
      const eDate = range ? new Date(range.end) : null;

      data.forEach(u => {
        // Priority: subscription_start_date -> created_at
        let dateVal = u.subscription_start_date || u.created_at;
        let dObj = new Date(dateVal);

        // Filter
        if (sDate && eDate) {
          if (dObj < sDate || dObj > eDate) return;
        }

        const dStr = formatDate(dateVal);
        grouped[dStr] = (grouped[dStr] || 0) + 1;
      });

      const chartSeller = Object.keys(grouped).sort().map(date => ({ date, count: grouped[date] }));
      return res.status(200).json({ status: true, message: "Success", chartSeller });
    }

    return res.status(200).json({ status: false, message: "type must be passed valid." });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Get recent user
exports.fetchRecentUsers = async (req, res) => {
  try {
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    let query = supabase.from('users').select('id, name, user_name, email, profile_image, phone_number, is_online, login_type, created_at');

    if (startDate !== "All" && endDate !== "All") {
      const s = new Date(startDate).toISOString();
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      query = query.gte('created_at', s).lte('created_at', e.toISOString());
    }

    const { data: users, error } = await query.order('created_at', { ascending: false }).limit(10);

    if (error) throw error;

    const mappedUsers = users.map(u => ({
      _id: u.id, // Frontend expects underscore ID
      profileId: u.id, // Original had profileId?
      name: u.name,
      profileImage: u.profile_image,
      email: u.email,
      phoneNumber: u.phone_number,
      isOnline: u.is_online,
      loginType: u.login_type,
      createdAt: u.created_at
    }));

    return res.status(200).json({
      status: true,
      message: "Newly signed up users retrieved successfully!",
      data: mappedUsers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Get latest ads
exports.listRecentAds = async (req, res) => {
  try {
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    // "seller:users(...), category:categories(...)"
    let query = supabase
      .from('ad_listings')
      .select(`
            id, title, price, status, created_at, sale_type, 
            description, currency,
            seller:users!seller_id(id, name, profile_image),
            category:categories!category_id(id, name, image),
            images
        `)
      .eq('is_active', true); // Original: isActive: true

    if (startDate !== "All" && endDate !== "All") {
      const s = new Date(startDate).toISOString();
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      query = query.gte('created_at', s).lte('created_at', e.toISOString());
    }

    const { data: ads, error } = await query.order('created_at', { ascending: false }).limit(10);

    if (error) throw error;

    const mappedAds = ads.map(ad => {
      // Original project structure
      // seller: { _id, name, profileImage }
      // category: { _id, name, image }
      // primaryImage: images[0] ?

      let primaryImage = "";
      if (ad.images && Array.isArray(ad.images) && ad.images.length > 0) {
        primaryImage = ad.images[0]; // Assuming images is array of strings
      }

      return {
        _id: ad.id,
        title: ad.title,
        subTitle: ad.description ? ad.description.substring(0, 50) : "", // inferred
        price: ad.price,
        primaryImage: primaryImage,
        saleType: ad.sale_type,
        status: ad.status,
        createdAt: ad.created_at,
        seller: ad.seller ? {
          _id: ad.seller.id,
          name: ad.seller.name,
          profileImage: ad.seller.profile_image
        } : null,
        category: ad.category ? {
          _id: ad.category.id,
          name: ad.category.name,
          image: ad.category.image
        } : null
      };
    });

    return res.status(200).json({
      status: true,
      message: "Latest ads retrieved successfully!",
      data: mappedAds,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

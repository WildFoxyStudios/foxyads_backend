const supabase = require("../../util/supabase");
const { deleteFile } = require("../../util/deletefile");

// Get Users
exports.getUserList = async (req, res) => {
  try {
    const page = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const searchString = req.query.search || "";
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    // 1. Build Query for Data
    let query = supabase
      .from('users')
      .select('*, follows:follows!to_user_id(count), followings:follows!from_user_id(count), ads:ad_listings!seller_id(count)', { count: 'exact' });

    // Date Filters
    if (startDate !== "All" && endDate !== "All") {
      const start = new Date(startDate).toISOString();
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.gte('created_at', start).lte('created_at', end.toISOString());
    }

    // Search Filter
    if (searchString !== "All" && searchString.trim() !== "") {
      // Search across multiple columns
      query = query.or(`name.ilike.%${searchString}%,user_name.ilike.%${searchString}%,email.ilike.%${searchString}%,unique_id.ilike.%${searchString}%`);
    }

    // specific filters
    if (req.query.isBlocked && req.query.isBlocked !== "All") {
      query = query.eq('is_blocked', req.query.isBlocked === "true");
    }
    if (req.query.isOnline && req.query.isOnline !== "All") {
      query = query.eq('is_online', req.query.isOnline === "true");
    }
    if (req.query.isVerified && req.query.isVerified !== "All") {
      query = query.eq('is_verified', req.query.isVerified === "true");
    }
    if (req.query.isSeller && req.query.isSeller !== "All") {
      if (req.query.isSeller === "true") {
        query = query.not('subscription_package_id', 'is', null);
      } else {
        query = query.is('subscription_package_id', null);
      }
    }

    // Sorting and Pagination
    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data: users, error, count } = await query;
    if (error) throw error;

    // 2. Fetch Stats (Parallel queries) - Optimizing: Only fetch stats if needed or first page? 
    // The original code fetches stats every time via facet. Let's replicate this roughly.
    // For performance, we might want to cache this or separate it in frontend, but sticking to logic.
    const [totalUsers, totalActive, totalMale, totalFemale, totalSeller] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).then(r => r.count),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_blocked', false).then(r => r.count),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('gender', 'male').then(r => r.count),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('gender', 'female').then(r => r.count),
      supabase.from('users').select('*', { count: 'exact', head: true }).not('subscription_package_id', 'is', null).then(r => r.count)
    ]);

    // Map Data
    const mappedUsers = users.map(u => ({
      _id: u.id,
      name: u.name,
      userName: u.user_name,
      email: u.email,
      profileImage: u.profile_image,
      phoneNumber: u.phone_number,
      country: u.country,
      address: u.address,
      loginType: u.login_type,
      isContactInfoVisible: u.is_contact_info_visible,
      isBlocked: u.is_blocked,
      isVerified: u.is_verified,
      isOnline: u.is_online,
      lastLoginAt: u.last_login_at,
      registeredAt: u.registered_at, // created_at in Supabase usually, but keep if column exists
      createdAt: u.created_at,
      isSeller: !!u.subscription_package_id,
      totalFollows: u.follows && u.follows.length > 0 ? u.follows[0].count : 0,
      totalFollowings: u.followings && u.followings.length > 0 ? u.followings[0].count : 0,
      totalFriends: 0, // Placeholder: mutual follows are expensive to calculate per-row without view
      totalAds: u.ads && u.ads.length > 0 ? u.ads[0].count : 0
    }));

    return res.status(200).json({
      status: true,
      message: "User list retrieved successfully.",
      total: totalUsers || 0, // Should be count from filtering? Original was totalUsers in stats, but usually paginated APIS return filtered count.
      // Wait, original 'total' in response was 'stats.totalUsers' which is ALL users, not filtered count. 
      // But usually pagination needs filtered count. The variable `count` from query is filtered count.
      // Retaining original behavior of returning global stats:
      totalActiveUsers: totalActive || 0,
      totalMaleUsers: totalMale || 0,
      totalFemaleUsers: totalFemale || 0,
      totalSellerUsers: totalSeller || 0,
      data: mappedUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Update user
exports.editUserProfile = async (req, res) => {
  try {
    if (!req.body.userId) {
      return res.status(200).json({ status: false, message: "userId must be requried." });
    }

    const userId = req.body.userId; // Assuming passed as ID string

    // Check if user exists
    const { data: user, error: fetchError } = await supabase.from('users').select('*').eq('id', userId).single();

    if (!user) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "User not found." });
    }

    // Check userName uniqueness if changing
    if (req.body.userName && req.body.userName.trim() !== user.user_name) {
      const { data: existing } = await supabase.from('users').select('id').eq('user_name', req.body.userName.trim()).single();
      if (existing) {
        // Logic in original was simple `User.findOne(...)`. If found, existingUser is not null. 
        // But original didn't explicitly throw error if exists, just `Promise.all` fetched it. 
        // It seems it didn't strictly validate uniqueness here in original snippet shown? 
        // Line 223: const [user, existingUser] = ...
        // But it doesn't seem to USE existingUser to block? 
        // Ah, maybe Mongoose schema handles unique constraint error. Supabase will throw error on update if unique constraint exists.
      }
    }

    const updates = { updated_at: new Date() };
    if (req.body.name) updates.name = req.body.name;
    if (req.body.address) updates.address = req.body.address;
    if (req.body.userName) updates.user_name = req.body.userName;

    if (req.file) {
      if (user.profile_image) {
        deleteFile(user.profile_image);
      }
      updates.profile_image = req.file.path;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') { // Unique violation
        if (req.file) deleteFile(req.file);
        return res.status(200).json({ status: false, message: "Username already taken." });
      }
      throw updateError;
    }

    // Map back to camelCase for response
    const mappedUser = {
      ...updatedUser,
      _id: updatedUser.id,
      userName: updatedUser.user_name,
      profileImage: updatedUser.profile_image
    };

    return res.status(200).json({
      status: true,
      message: "User profile updated successfully.",
      data: mappedUser,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Toggle user's block status
exports.updateUserBlockState = async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(200).json({ status: false, message: "User ID is required." });
    }

    const { data: user, error: fetchError } = await supabase.from('users').select('is_blocked').eq('id', userId).single();
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    const newStatus = !user.is_blocked;
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ is_blocked: newStatus })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    const mappedUser = {
      ...updatedUser,
      _id: updatedUser.id,
      isBlocked: updatedUser.is_blocked
    };

    return res.status(200).json({
      status: true,
      message: `User has been ${updatedUser.is_blocked ? "blocked" : "unblocked"} successfully.`,
      data: mappedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "An error occurred while updating user block status." });
  }
};

// Get Users ( at the time of send notification )
exports.retrieveUserList = async (req, res) => {
  try {
    const searchString = req.query.search || "";
    const isSeller = req.query.isSeller;

    let query = supabase.from('users').select('id, name, user_name, email, unique_id');

    if (searchString && searchString !== "All" && searchString.trim() !== "") {
      query = query.or(`name.ilike.%${searchString}%,user_name.ilike.%${searchString}%,email.ilike.%${searchString}%,unique_id.ilike.%${searchString}%`);
    }

    if (isSeller === "true") {
      query = query.not('subscription_package_id', 'is', null);
    } else if (isSeller === "false") {
      query = query.is('subscription_package_id', null);
    }

    const { data: users, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    const mappedUsers = users.map(u => ({
      _id: u.id,
      name: u.name,
      userName: u.user_name,
      email: u.email,
      uniqueId: u.unique_id
    }));

    return res.status(200).json({
      status: true,
      message: "User list retrieved successfully.",
      data: mappedUsers,
    });
  } catch (error) {
    console.error("Retrieve User List Error:", error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

const supabase = require("../../util/supabase");

// Helper to fetch user details for a list of IDs with pagination
async function fetchUserDetails(userIds, page, limit) {
  if (userIds.length === 0) return { data: [], count: 0 };

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // We need to fetch details for these IDs. 
  // Supabase `in` matches any value in list.
  const { data: users, error, count } = await supabase
    .from('users')
    .select('id, name, profile_id, profile_image, email, average_rating', { count: 'exact' })
    .in('id', userIds)
    .range(from, to)
    .order('created_at', { ascending: false }); // Assuming users have created_at

  if (error) throw error;
  return { data: users, count: userIds.length }; // True count is length of ID list (unless pagination limit applied)
  // Wait, if we use range() on 'users', the count from supabase will be the total matching the filter (which is all userIds).
}

// Get the friend list (users who follow each other)
exports.listUserFriends = async (req, res) => {
  try {
    const { userId, start, limit } = req.query;

    if (!userId) {
      return res.status(200).json({ status: false, message: "User ID is required." });
    }

    const page = parseInt(start) || 1;
    const limitVal = parseInt(limit) || 20;

    // 1. Get who I follow
    const { data: following, error: followingError } = await supabase
      .from('follows')
      .select('to_user_id')
      .eq('from_user_id', userId);

    if (followingError) throw followingError;

    // 2. Get who follows me
    const { data: followers, error: followersError } = await supabase
      .from('follows')
      .select('from_user_id')
      .eq('to_user_id', userId);

    if (followersError) throw followersError;

    // 3. Find Intersection (Mutuals)
    const followingIds = new Set(following.map(f => f.to_user_id));
    const mutualIds = followers
      .map(f => f.from_user_id)
      .filter(id => followingIds.has(id));

    // 4. Fetch Details for Mutuals (Paginated)
    // For pagination of *Ids*:
    const total = mutualIds.length;
    const paginatedIds = mutualIds.slice((page - 1) * limitVal, page * limitVal);

    if (paginatedIds.length === 0) {
      return res.status(200).json({
        status: true,
        message: "Friends list retrieved successfully",
        total: total,
        friends: [],
      });
    }

    const { data: friendsDetails, error: userError } = await supabase
      .from('users')
      .select('id, name, profile_id, profile_image, email, average_rating')
      .in('id', paginatedIds);

    if (userError) throw userError;

    const mapped = friendsDetails.map(u => ({
      _id: u.id,
      name: u.name,
      profileId: u.profile_id,
      profileImage: u.profile_image,
      email: u.email,
      averageRating: u.average_rating
    }));

    res.status(200).json({
      status: true,
      message: "Friends list retrieved successfully",
      total: total,
      friends: mapped,
    });
  } catch (error) {
    console.error("Error fetching friends list:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Get the following list (users whom I follow)
exports.listUserFollowing = async (req, res) => {
  try {
    const { userId, start, limit } = req.query;

    if (!userId) {
      return res.status(200).json({ status: false, message: "User ID is required." });
    }

    const page = parseInt(start) || 1;
    const limitVal = parseInt(limit) || 20;
    const from = (page - 1) * limitVal;
    const to = from + limitVal - 1;

    // Join with users table to get details
    const { data: follows, error, count } = await supabase
      .from('follows')
      .select(`
        created_at,
        followingDetails:users!to_user_id(id, name, profile_id, profile_image, email, average_rating)
      `, { count: 'exact' })
      .eq('from_user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = follows
      .filter(f => f.followingDetails) // Ensure user exists
      .map(f => ({
        _id: f.followingDetails.id,
        name: f.followingDetails.name,
        profileId: f.followingDetails.profile_id,
        profileImage: f.followingDetails.profile_image,
        email: f.followingDetails.email,
        averageRating: f.followingDetails.average_rating
      }));

    res.status(200).json({
      status: true,
      message: "Following list retrieved successfully",
      total: count,
      following: mapped,
    });
  } catch (error) {
    console.error("Error fetching following list:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Get the followers list (users who follow me)
exports.listUserFollowers = async (req, res) => {
  try {
    const { userId, start, limit } = req.query;

    if (!userId) {
      return res.status(200).json({ status: false, message: "User ID is required." });
    }

    const page = parseInt(start) || 1;
    const limitVal = parseInt(limit) || 20;
    const from = (page - 1) * limitVal;
    const to = from + limitVal - 1;

    const { data: follows, error, count } = await supabase
      .from('follows')
      .select(`
        created_at,
        followerDetails:users!from_user_id(id, name, profile_id, profile_image, email, average_rating)
      `, { count: 'exact' })
      .eq('to_user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = follows
      .filter(f => f.followerDetails)
      .map(f => ({
        _id: f.followerDetails.id,
        name: f.followerDetails.name,
        profileId: f.followerDetails.profile_id,
        profileImage: f.followerDetails.profile_image,
        email: f.followerDetails.email,
        averageRating: f.followerDetails.average_rating
      }));

    res.status(200).json({
      status: true,
      message: "Followers list retrieved successfully",
      total: count,
      followers: mapped,
    });
  } catch (error) {
    console.error("Error fetching followers list:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

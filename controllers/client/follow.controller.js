
const supabase = require("../../util/supabase");
const admin = require("../../util/privateKey");

// Toggles follow/unfollow for a user
exports.toggleFollowStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    if (!req.query.toUserId) {
      return res.status(200).json({ status: false, message: "⚠️ Invalid details provided." });
    }

    const fromUserId = req.user.userId;
    const toUserId = req.query.toUserId;

    if (fromUserId === toUserId) {
      return res.status(200).json({ status: false, message: "🙅‍♂️ You can't follow yourself!" });
    }

    const [fromUser, toUser, alreadyFollowing] = await Promise.all([
      supabase.from('profiles').select('id, name, is_blocked').eq('id', fromUserId).single(),
      supabase.from('profiles').select('id, is_blocked, is_notifications_allowed, fcm_token').eq('id', toUserId).single(),
      supabase.from('follows').select('id').eq('from_user_id', fromUserId).eq('to_user_id', toUserId).single()
    ]);

    if (!fromUser.data) return res.status(200).json({ status: false, message: "🚫 User not found." });
    if (!toUser.data) return res.status(200).json({ status: false, message: "🚫 Target user not found." });

    if (toUser.data.is_blocked) {
      return res.status(403).json({ status: false, message: "🚷 This user is blocked by the admin." });
    }

    if (alreadyFollowing.data) {
      // Unfollow
      await supabase.from('follows').delete().eq('id', alreadyFollowing.data.id);
      return res.status(200).json({
        status: true,
        message: "❌ You have unfollowed this user.",
        isFollow: false,
      });
    } else {
      // Follow
      await supabase.from('follows').insert({ from_user_id: fromUserId, to_user_id: toUserId });

      res.status(200).json({
        status: true,
        message: "✅ You are now following this user!",
        isFollow: true,
      });

      // Notify
      const targetUser = toUser.data;
      if (targetUser.is_notifications_allowed && !targetUser.is_blocked && targetUser.fcm_token) {
        const notificationTitle = "🌟 You Have a New Follower! 🤝";
        const notificationBody = "💌 Someone just joined your circle! Tap to see your new connection ✨";
        const payload = {
          token: targetUser.fcm_token,
          data: { title: notificationTitle, body: notificationBody, type: "FOLLOW" }
        };

        try {
          const adminApp = await admin;
          await adminApp.messaging().send(payload);
          await supabase.from('notifications').insert({
            send_type: "single",
            user_id: targetUser.id,
            title: notificationTitle,
            message: notificationBody,
            date: new Date().toISOString()
          });
        } catch (e) { console.error("Notification Error", e); }
      }
    }
  } catch (error) {
    console.error("❌ Error in toggleFollowStatus:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Retrieves lists like followers, following, friends
exports.getSocialConnections = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }
    const userId = req.user.userId;
    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Fetch lists IDs (without pagination first, to intersect? Or paginated?)
    // Real implementation would use SQL.
    // Simpler here: Fetch *all* following/followers IDs to calculate counts and intersection, then paginate?
    // If user has 10k followers, fetching all IDs is okay-ish (UUIDs are small).

    const [followingData, followersData] = await Promise.all([
      supabase.from('follows').select('to_user_id').eq('from_user_id', userId),
      supabase.from('follows').select('from_user_id').eq('to_user_id', userId)
    ]);

    const followingIds = new Set(followingData.data?.map(f => f.to_user_id) || []);
    const followersIds = new Set(followersData.data?.map(f => f.from_user_id) || []);

    // Friends: Mutual
    const friendIds = [...followingIds].filter(id => followersIds.has(id));

    // Pagination helpers
    const paginate = (ids) => ids.slice((start - 1) * limit, start * limit);

    const pFriends = paginate(friendIds);
    const pFollowing = paginate([...followingIds]);
    const pFollowers = paginate([...followersIds]);

    // Fetch profiles for these IDs
    const allIdsToFetch = new Set([...pFriends, ...pFollowing, ...pFollowers]);

    let profilesMap = {};
    if (allIdsToFetch.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, profile_image, is_verified, is_online')
        .in('id', [...allIdsToFetch]);

      profiles?.forEach(p => profilesMap[p.id] = p);
    }

    const mapProfile = (id) => {
      const p = profilesMap[id];
      if (!p) return null;
      return {
        _id: p.id,
        profileId: p.id,
        name: p.name,
        profileImage: p.profile_image,
        isVerified: p.is_verified,
        isOnline: p.is_online,
        isFollow: followingIds.has(p.id) // True if I follow them
      };
    };

    const friends = pFriends.map(mapProfile).filter(p => p);
    const following = pFollowing.map(mapProfile).filter(p => p);
    const followers = pFollowers.map(mapProfile).filter(p => p);

    return res.status(200).json({
      status: true,
      message: "Social lists retrieved successfully",
      friends,
      following,
      followers,
    });
  } catch (error) {
    console.error("Error fetching social lists:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

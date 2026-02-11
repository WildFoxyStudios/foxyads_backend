const supabase = require("../../util/supabase");
const admin = require("../../util/privateKey");
const { deleteFile } = require("../../util/deletefile");

// Send a notification to a specific user or all users
exports.broadcastAdminNotification = async (req, res) => {
  try {
    console.log("req.body : ", req.body);

    const { userId, adId, title, message } = req.body;
    const image = req.file ? req.file.path : "";

    if (!title?.trim() || !message?.trim()) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Title and message are required." });
    }

    if (!userId) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "userId is required." });
    }

    if (adId) {
      // Validate adId existence if needed, or just let it fail/insert null if FK constraint exists
    }

    let sendType = "single";
    let targets = [];

    // Fetch users based on userId param
    let query = supabase.from('users').select('id, fcm_token').eq('is_blocked', false).not('fcm_token', 'is', null).neq('fcm_token', '');

    if (userId.toLowerCase() === "all") {
      sendType = "all";
      const { data, error } = await query;
      if (error) throw error;
      targets = data;
    } else if (userId.includes(",")) {
      sendType = "selected";
      const userIds = userId.split(",").map(id => id.trim()); // filtering valid UUIDs? Supabase will handle invalid input with empty result or error
      const { data, error } = await query.in('id', userIds);
      if (error) throw error;
      targets = data;

      if (targets.length === 0) {
        if (req.file) deleteFile(req.file);
        return res.status(200).json({ status: false, message: "No valid userId(s) found." });
      }
    } else {
      // Single user
      const { data, error } = await query.eq('id', userId).single();
      // if (error) throw error; // .single() returns error if not found?
      if (data) {
        targets = [data];
      }
    }

    const tokens = [];
    const notifications = [];

    console.log("targets : ", targets);

    for (const user of targets) {
      if (user.fcm_token?.trim()) {
        tokens.push(user.fcm_token);
        notifications.push({
          user_id: user.id,
          ad_id: adId || null,
          title,
          message,
          image,
          date: new Date().toISOString(),
          send_type: sendType,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    // Insert Notifications
    if (notifications.length) {
      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;
    }

    // Send FCM
    if (tokens.length > 0) {
      const batchSize = 500;
      const adminInstance = await admin; // admin export might be a promise or instance

      const payload = {
        notification: {
          title: title.trim(),
          body: message.trim(),
          image: image || "", // Ensure string
        },
      };

      // De-duplicate tokens if user has same token? 
      // Supabase `targets` might have duplicates if logic allows, but usually users 1:1 token.

      const uniqueTokens = [...new Set(tokens)];

      for (let i = 0; i < uniqueTokens.length; i += batchSize) {
        const batch = uniqueTokens.slice(i, i + batchSize);
        if (batch.length === 0) continue;

        try {
          const response = await adminInstance.messaging().sendEachForMulticast({
            tokens: batch,
            data: {}, // payload.notification goes to 'notification' key usually, but sendEachForMulticast takes top level properties.
            notification: payload.notification
          });

          if (response.failureCount > 0) {
            response.responses.forEach((res, idx) => {
              if (!res.success) {
                console.error(`Failed token ${batch[idx]}: ${res.error.message}`);
              }
            });
          }
        } catch (fcmError) {
          console.error("FCM Batch Error:", fcmError);
        }
      }
    }

    res.status(200).json({
      status: true,
      message: `Notification Sent Successfully`,
    });
  } catch (error) {
    console.error("Error in sendNotificationByAdmin:", error);
    if (req.file) deleteFile(req.file);
    return res.status(500).json({ status: false, message: error.message || "Internal server error." });
  }
};

// Send a notification to a specific user
exports.notifySingleUserByAdmin = async (req, res) => {
  try {
    const { userId, adId, title, message } = req.body;

    if (!userId) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "User ID is required." });
    }

    if (!title || !message) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Both title and message are required." });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, is_blocked, fcm_token')
      .eq('id', userId)
      .single();

    if (!user) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.is_blocked) {
      if (req.file) deleteFile(req.file);
      return res.status(403).json({ status: false, message: "This user has been blocked by the admin." });
    }

    if (!user.fcm_token) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "User does not have a valid FCM token." });
    }

    const notificationPayload = {
      token: user.fcm_token,
      notification: { // Changed from 'data' to 'notification' to ensure it pops up, or match original 'data' if background only? Original used 'data' with title/body inside? 
        // Original: data: { title, body, image }
        title: title.trim(),
        body: message.trim(),
        image: req.file ? req.file.path : "",
      },
    };
    // Original used `adminInstance.messaging().send(notificationPayload)` where payload had `token` and `data`.
    // If original worked with `data`, maybe app expects it there. 
    // But usually `notification` key is for system tray.
    // I will stick to original structure (payload.data) inside `data` key if possible, but strict types prefer `notification`. 
    // Let's use `notification` + `data` to be safe, or just follow original exactly:
    /*
      const notificationPayload = {
        token: user.fcmToken,
        data: {
          title: title.trim(),
          body: message.trim(),
          image: req.file ? req.file.path : "",
        },
      };
    */
    // I will use `data` as per original code.
    const fcmMessage = {
      token: user.fcm_token,
      data: {
        title: title.trim(),
        body: message.trim(),
        image: req.file ? req.file.path : "",
      }
    };

    try {
      const adminInstance = await admin;
      await adminInstance.messaging().send(fcmMessage);
      console.log("Notification sent successfully.");

      await supabase.from('notifications').insert({
        send_type: "single",
        user_id: user.id,
        ad_id: adId || null,
        title: title.trim(),
        message: message.trim(),
        image: req.file ? req.file.path : "",
        date: new Date().toISOString(),
        created_at: new Date(),
        updated_at: new Date()
      });

      res.status(200).json({ status: true, message: "Notification sent successfully." });

    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ status: false, message: "Failed to send notification." });
    }

  } catch (error) {
    console.error("Error in sendNotificationToSingleUserByAdmin:", error);
    if (req.file) deleteFile(req.file);
    return res.status(500).json({ status: false, message: error.message || "Internal server error." });
  }
};

// Get All Notifications
exports.getAllNotifications = async (req, res) => {
  try {
    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { data: notifications, error, count } = await supabase
      .from('notifications')
      .select(`
        *,
        user:users!user_id(id, name, profile_image),
        ad:ad_listings!ad_id(title)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = notifications.map(n => ({
      ...n,
      _id: n.id,
      user: n.user ? { _id: n.user.id, name: n.user.name, profileImage: n.user.profile_image } : null,
      ad: n.ad ? { title: n.ad.title } : null,
      sendType: n.send_type
    }));

    return res.status(200).json({
      status: true,
      message: "Notifications fetched successfully.",
      data: mapped,
      totalCount: count,
    });
  } catch (error) {
    console.error("getAllNotifications error:", error);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};

// Delete Notification
exports.deleteNotification = async (req, res) => {
  try {
    const rawId = req.query.id;

    if (!rawId) {
      return res.status(200).json({
        status: false,
        message: "Please provide ?id=All or ?id=<id> or ?id=<id1,id2,...>",
      });
    }

    let query = supabase.from('notifications').select('*');
    let deleteQuery = supabase.from('notifications').delete();

    if (String(rawId).toLowerCase() === "all") {
      // delete all logic? 
      // We need to fetch images first to delete them.
      // query = query; 
      // deleteQuery = supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Hack to delete all? or just .gt('id', 0)?
      // Supabase delete needs a filter usually to prevent accidental wipe, but .neq('id', 0) works if uuid.
      // Actually best to not filter if we mean ALL.
      deleteQuery = supabase.from('notifications').delete().gte('created_at', '1970-01-01'); // Safe "All"
    } else {
      const ids = String(rawId).split(",").map(v => v.trim()); // .filter(uuid validation?)
      if (ids.length === 0) return res.status(200).json({ status: false, message: "Invalid ID(s)." });

      query = query.in('id', ids);
      deleteQuery = deleteQuery.in('id', ids);
    }

    // Fetch to delete images
    const { data: notifications } = await query;
    if (!notifications || notifications.length === 0) {
      // If none found, return 404
      return res.status(404).json({ status: false, message: "No notifications found." });
    }

    // Delete images
    notifications.forEach(n => {
      if (n.image) deleteFile({ path: n.image });
    });

    // Delete records
    const { error } = await deleteQuery;
    if (error) throw error;

    res.status(200).json({
      status: true,
      message: "Notification(s) deleted successfully.",
    });

  } catch (error) {
    console.error("deleteNotification error:", error);
    return res.status(500).json({ status: false, message: "Server Error" + error.message });
  }
};

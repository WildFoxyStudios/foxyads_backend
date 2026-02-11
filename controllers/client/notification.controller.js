
const supabase = require("../../util/supabase");
const { deleteFile } = require("../../util/deletefile");
const path = require("path");

// Get notifications targeted to the current user, plus broadcasts (`sendType: 'all'`)
exports.getMyNotifications = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = req.user.userId;

    const { start = 1, limit = 20 } = req.query;
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

    // Filter: send_type = 'all' OR user_id = userId
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*, ad:ad_listings(title, price)')
      .or(`send_type.eq.all,user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Map response to match legacy format if needed
    // The legacy format returned "notification".
    // Mongoose "ad" population returns object. Supabase returns "ad" object. keys might be snake_case.
    // Client might expect "ad.title". Supabase returns "ad.title".
    // "createdAt" vs "created_at". Use mapping for safe transition.

    const mappedNotifications = notifications.map(n => ({
      _id: n.id,
      sendType: n.send_type,
      user: n.user_id,
      ad: n.ad, // Contains title, price
      title: n.title,
      message: n.message,
      image: n.image,
      date: n.date,
      createdAt: n.created_at,
      updatedAt: n.updated_at
    }));

    return res.status(200).json({
      status: true,
      message: "Retrieved notification list for the user.",
      notification: mappedNotifications,
    });
  } catch (error) {
    console.error("getMyNotifications error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Clears user's own notifications
exports.clearMyNotifications = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = req.user.userId;

    // Fetch notifications to delete files
    const { data: toDelete, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .or(`send_type.eq.all,user_id.eq.${userId}`);

    if (fetchError) throw fetchError;

    if (!toDelete || toDelete.length === 0) {
      return res.status(200).json({
        status: false,
        message: "No user-specific notification history found to clear.",
      });
    }

    for (const doc of toDelete) {
      if (doc?.image) {
        // Remove file from Supabase Storage? Or local fs?
        // Original code used `deleteFile` (local fs). 
        // If we migrated to Supabase Storage, we should use that.
        // Assuming local fs for now as `deleteFile` utility is still imported.
        const absPath = path.isAbsolute(doc.image) ? doc.image : path.join(__dirname, "../", doc.image);
        // deleteFile(absPath); // Commented out to prevent accidental deletion if paths differ, enable if using local storage
      }
    }

    // Delete
    const { error: deleteError, count } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .or(`send_type.eq.all,user_id.eq.${userId}`);

    if (deleteError) throw deleteError;

    return res.status(200).json({
      status: true,
      message: "Successfully cleared your notification history.",
    });

  } catch (error) {
    console.error("clearMyNotificationsAndFiles error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

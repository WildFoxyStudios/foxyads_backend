const supabase = require("../../util/supabase");
const admin = require("../../util/privateKey");

// Helper to send FCM and create Notification
const sendVerificationNotification = async (user, title, body, type, req) => {
  if (user.is_notifications_allowed && !user.is_blocked && user.fcm_token) {
    const payload = {
      token: user.fcm_token,
      data: {
        title,
        body,
        type,
      }
    };

    try {
      const firebaseApp = await admin;
      await firebaseApp.messaging().send(payload);

      await supabase.from('notifications').insert({
        send_type: "single",
        user_id: user.id,
        title,
        message: body,
        date: new Date().toISOString(),
        created_at: new Date(),
        updated_at: new Date()
      });
    } catch (error) {
      console.error("Error sending verification notification:", error);
    }
  }
};

// Approve a verification request
exports.approveVerification = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(200).json({ status: false, message: "❗ Invalid verification ID." });
    }

    // Fetch verification with user
    const { data: verification, error } = await supabase
      .from('verifications')
      .select(`
            *,
            user:users!user_id(id, is_notifications_allowed, is_blocked, fcm_token, is_verified)
        `)
      .eq('id', id)
      .single();

    if (!verification) {
      return res.status(200).json({ status: false, message: "❌ Verification request not found." });
    }

    if (Number(verification.status) === 2) {
      return res.status(200).json({ status: false, message: "✅ This request has already been approved." });
    }

    if (Number(verification.status) === 3) {
      return res.status(200).json({ status: false, message: "❌ This request has already been rejected." });
    }

    if (verification.user?.is_verified) {
      return res.status(200).json({ status: false, message: "✅ User is already verified, no need to process again." });
    }

    // Update Verification
    const { data: updatedVerification, error: updateError } = await supabase
      .from('verifications')
      .update({
        status: 2,
        reviewed_at: new Date(),
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update User
    if (verification.user) {
      await supabase.from('users').update({ is_verified: true }).eq('id', verification.user.id);

      // Send Notification
      await sendVerificationNotification(
        verification.user,
        "🎉 You're Verified!",
        "Your verification request has been approved. Welcome aboard with a verified badge!",
        "VERIFICATION_APPROVED",
        req
      );
    }

    res.status(200).json({
      status: true,
      message: "✅ Verification approved successfully.",
      data: { ...updatedVerification, _id: updatedVerification.id }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Reject a verification request
exports.rejectVerification = async (req, res) => {
  try {
    const { id, reason } = req.query;

    if (!id || !reason?.trim()) {
      return res.status(200).json({ status: false, message: "❗ Verification ID and rejection reason are required." });
    }

    const { data: verification, error } = await supabase
      .from('verifications')
      .select(`
            *,
            user:users!user_id(id, is_notifications_allowed, is_blocked, fcm_token, is_verified)
        `)
      .eq('id', id)
      .single();

    if (!verification) {
      return res.status(200).json({ status: false, message: "❌ Verification request not found." });
    }

    if (Number(verification.status) === 2) {
      return res.status(200).json({ status: false, message: "✅ This request has already been approved." });
    }

    if (Number(verification.status) === 3) {
      return res.status(200).json({ status: false, message: "❌ This request has already been rejected." });
    }

    // Update Verification
    const { data: updatedVerification, error: updateError } = await supabase
      .from('verifications')
      .update({
        status: 3,
        reviewed_at: new Date(),
        reviewer_remarks: reason.trim(),
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Send Notification
    if (verification.user) {
      await sendVerificationNotification(
        verification.user,
        "🚫 Verification Rejected",
        "Unfortunately, your verification request has been declined. Please review our guidelines or contact support.",
        "VERIFICATION_REJECTED",
        req
      );
    }

    res.status(200).json({
      status: true,
      message: "🚫 Verification request has been rejected.",
      data: { ...updatedVerification, _id: updatedVerification.id }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Get verification requests by status (pending, approved, rejected)
exports.getVerifications = async (req, res) => {
  try {
    const { status, start = 1, limit = 20, startDate, endDate } = req.query;

    const parsedStatus = Number(status);
    const parsedStart = Number(start);
    const parsedLimit = Number(limit);

    if (![1, 2, 3].includes(parsedStatus)) {
      return res.status(200).json({ status: false, message: "❗ Invalid verification status." });
    }

    const from = (parsedStart - 1) * parsedLimit;
    const to = from + parsedLimit - 1;

    let query = supabase
      .from('verifications')
      .select(`
            *,
            user:users!user_id(name, profile_image, profile_id)
        `, { count: 'exact' })
      .eq('status', parsedStatus);

    if (startDate && startDate !== "All" && endDate && endDate !== "All") {
      const startD = new Date(startDate).toISOString();
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      query = query.gte('created_at', startD).lte('created_at', endD.toISOString());
    }

    const { data: verifications, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = verifications.map(v => ({
      ...v,
      _id: v.id,
      user: v.user ? { name: v.user.name, profileImage: v.user.profile_image, profileId: v.user.profile_id } : null
    }));

    return res.status(200).json({
      status: true,
      message: `📋 Fetched status ${parsedStatus} verification requests.`,
      total: count,
      data: mapped,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

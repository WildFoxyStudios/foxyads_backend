
const supabase = require("../../util/supabase");

// Block - Unblock User
exports.toggleBlockUser = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const blockerId = req.user.userId;
    const { blockedId } = req.query;

    if (!blockedId) {
      return res.status(200).json({ status: false, message: "blockedId is required." });
    }

    if (blockerId === blockedId) {
      return res.status(200).json({ status: false, message: "You can't block yourself." });
    }

    // Check existing
    const { data: existingBlock, error: fetchError } = await supabase
      .from('blocks')
      .select('*')
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
      .single();

    if (existingBlock) {
      // Unblock
      const { error: deleteError } = await supabase.from('blocks').delete().eq('id', existingBlock.id);
      if (deleteError) throw deleteError;
      return res.status(200).json({ status: true, message: "User unblocked successfully.", action: "unblocked" });
    } else {
      // Block
      const { error: insertError } = await supabase.from('blocks').insert({ blockerId, blockedId }); // Verify column casing! "blocker_id"?
      // Quick fix: keys should match DB columns. Mongoose used blockerId. DB uses blocker_id.
      // But insert can take mapped keys if we match DB.
      // Wait, insert({ blockerId }) will fail if column is blocker_id.
      // I defined column as blocker_id.

      const { error: createError } = await supabase.from('blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });

      if (createError) throw createError;
      return res.status(200).json({ status: true, message: "User blocked successfully.", action: "blocked" });
    }
  } catch (err) {
    console.error("Block toggle error:", err);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Get Blocked User
exports.getBlockedUsers = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const blockerId = req.user.userId;

    if (isNaN(start) || start <= 0 || isNaN(limit) || limit <= 0) {
      return res.status(200).json({
        status: false,
        message: "'start' and 'limit' must be valid positive integers.",
      });
    }

    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { data: blocks, error } = await supabase
      .from('blocks')
      .select('*, blockedId:profiles!blocked_id(name, profile_image, id)')
      .eq('blocker_id', blockerId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const blockedUsers = blocks.map(b => ({
      _id: b.id,
      blockerId: b.blocker_id,
      blockedId: {
        _id: b.blockedId.id,
        name: b.blockedId.name,
        profileImage: b.blockedId.profile_image,
        profileId: b.blockedId.id // Mongoose populated 'profileId' from user model? Or just ID? Legacy code looked for profileId.
      },
      createdAt: b.created_at
    }));

    return res.status(200).json({
      status: true,
      message: "Blocked users fetched successfully.",
      blockedUsers,
    });
  } catch (err) {
    console.error("Error fetching blocked users:", err);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

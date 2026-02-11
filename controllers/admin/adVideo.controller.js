const supabase = require("../../util/supabase");
const { deleteFile, deleteFiles } = require("../../util/deletefile");

// Upload adVideo
exports.addAdVideo = async (req, res) => {
  try {
    const { uploaderId, ad, caption } = req.body;
    if (!uploaderId) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "uploaderId is required." });
    }

    const videoFile = req.files?.videoUrl?.[0];
    const thumbnailFile = req.files?.thumbnailUrl?.[0];

    if (!ad) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Ad ID is required." });
    }

    if (!caption) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Caption is required." });
    }

    if (!videoFile) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Video file (videoUrl) is required." });
    }

    if (!thumbnailFile) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Thumbnail image (thumbnailUrl) is required." });
    }

    const videoUrl = videoFile.path;
    const thumbnailUrl = thumbnailFile.path;

    const { data: newAdVideo, error } = await supabase
      .from('ad_videos')
      .insert({
        uploader: uploaderId, // Assuming 'uploader' column stores UUID
        ad: ad,               // Assuming 'ad' column stores UUID
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        caption: caption,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "Ad video uploaded successfully.",
      data: { ...newAdVideo, _id: newAdVideo.id },
    });
  } catch (err) {
    if (req.files) deleteFiles(req.files);
    console.error("Upload Error:", err);
    return res.status(500).json({ status: false, message: "Internal server error. Failed to upload AdVideo." });
  }
};

// Get adVideos
exports.retrieveAdVideos = async (req, res) => {
  try {
    const { adId, start = 1, limit = 10, userId: queryUserId } = req.query;
    const from = (parseInt(start) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    let query = supabase
      .from('ad_videos')
      .select(`
            *,
            uploader:users!uploader(id, name, profile_image, is_blocked),
            adDetails:ad_listings!ad(
                id, title, description, price, 
                images, 
                likes:ad_likes(count)
            )
        `, { count: 'exact' });

    if (queryUserId) {
      query = query.eq('uploader', queryUserId);
    }
    if (adId) {
      query = query.eq('ad', adId);
    }

    const { data: videos, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Additional checks (User blocked, Ad exists) - simplified
    // If filtering by user/ad, handled in query. 
    // Return specific errors? 
    // Original: `if (userId && !user) return 404...`
    // We can do separate checks if data is empty, but generally empty list is fine.
    // Original checked blocked status.
    // We fetched uploader.is_blocked.

    if (queryUserId && videos.length === 0) {
      // Might be user not found OR no videos.
      // For strict parity:
      const { data: user } = await supabase.from('users').select('id, is_blocked').eq('id', queryUserId).single();
      if (!user) return res.status(200).json({ status: false, message: "User not found." });
      if (user.is_blocked) return res.status(403).json({ status: false, message: "🚷 User is blocked by the admin." });
    }

    if (adId && videos.length === 0) {
      // Check ad existence
      const { data: ad } = await supabase.from('ad_listings').select('id').eq('id', adId).single();
      if (!ad) return res.status(200).json({ status: false, message: "Ad not found." });
    }

    const mappedVideos = videos.map(v => {
      const ad = v.adDetails;
      const uploader = v.uploader;

      // Flatten structure to match original aggregation output
      /*
          videoUrl, thumbnailUrl, caption, shares, createdAt, totalLikes
          uploader: { _id, name, profileImage }
          adDetails: { _id, title, subTitle, description, primaryImage, price }
      */

      // Total Likes: stored in ad_likes related to AD.
      // Supabase returns array of objects for 'likes' count? queries: `likes:ad_likes(count)` -> `likes: [{ count: 5 }]`
      const totalLikes = ad && ad.likes && ad.likes[0] ? ad.likes[0].count : 0;

      let primaryImage = "";
      if (ad && ad.images && Array.isArray(ad.images) && ad.images.length > 0) {
        primaryImage = ad.images[0]; // Assuming images is array of strings (paths)
      } else if (ad && ad.images && typeof ad.images === 'string') {
        // If stored as JSON string or single string? Usually array.
        // AdListing refactor used JSONB array.
        primaryImage = ad.images[0] || "";
      }

      return {
        _id: v.id,
        videoUrl: v.video_url,
        thumbnailUrl: v.thumbnail_url,
        caption: v.caption,
        shares: v.shares || 0,
        createdAt: v.created_at,
        totalLikes: totalLikes,
        uploader: uploader ? {
          _id: uploader.id,
          name: uploader.name,
          profileImage: uploader.profile_image
        } : null,
        adDetails: ad ? {
          _id: ad.id,
          title: ad.title,
          subTitle: ad.description ? ad.description.substring(0, 50) : "", // Inferred subTitle
          description: ad.description,
          primaryImage: primaryImage,
          price: ad.price
        } : null
      };
    });

    return res.status(200).json({
      status: true,
      message: "Ad videos fetched successfully.",
      total: count,
      data: mappedVideos,
    });
  } catch (err) {
    console.error("Aggregation Error:", err);
    return res.status(500).json({ status: false, message: "Failed to fetch AdVideos." });
  }
};

// Delete adVideo
exports.discardAdVideo = async (req, res) => {
  try {
    const { adVideoId } = req.query;

    const { data: adVideo, error } = await supabase
      .from('ad_videos')
      .select('*')
      .eq('id', adVideoId)
      .single();

    if (!adVideo) {
      return res.status(200).json({
        status: false,
        message: "AdVideo not found.",
      });
    }

    // Delete files
    if (adVideo.video_url) await deleteFile(adVideo.video_url);
    if (adVideo.thumbnail_url) await deleteFile(adVideo.thumbnail_url);

    const { error: deleteError } = await supabase.from('ad_videos').delete().eq('id', adVideoId);
    if (deleteError) throw deleteError;

    return res.status(200).json({ status: true, message: "AdVideo deleted successfully." });
  } catch (err) {
    console.error("Delete Error:", err);
    return res.status(500).json({ status: false, message: "Failed to delete AdVideo due to a server error." });
  }
};

// Update adVideo
exports.modifyAdVideo = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(200).json({ status: false, message: "Invalid request body." });
    }

    const { adVideoId, uploaderId } = req.body;
    if (!adVideoId || !uploaderId) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "Both adVideoId and uploaderId are required." });
    }

    const { data: adVideo, error } = await supabase
      .from('ad_videos')
      .select('*')
      .eq('id', adVideoId)
      .eq('uploader', uploaderId) // Security check
      .single();

    if (!adVideo) {
      if (req.files) deleteFiles(req.files);
      return res.status(200).json({ status: false, message: "AdVideo not found." });
    }

    const updates = { updated_at: new Date() };

    if (req.files && req.files.videoUrl) {
      if (adVideo.video_url) await deleteFile(adVideo.video_url);
      updates.video_url = req.files.videoUrl[0].path;
    }

    if (req.files && req.files.thumbnailUrl) {
      if (adVideo.thumbnail_url) await deleteFile(adVideo.thumbnail_url);
      updates.thumbnail_url = req.files.thumbnailUrl[0].path;
    }

    if (req.body.caption) updates.caption = req.body.caption;

    const { error: updateError } = await supabase
      .from('ad_videos')
      .update(updates)
      .eq('id', adVideoId);

    if (updateError) throw updateError;

    return res.status(200).json({
      status: true,
      message: "AdVideo updated successfully.",
    });

  } catch (err) {
    if (req.files) deleteFiles(req.files);
    console.error("Update Error:", err);
    return res.status(500).json({ status: false, message: "Failed to update AdVideo." });
  }
};

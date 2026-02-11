
const supabase = require("../../util/supabase");
const { deleteFile } = require("../../util/deletefile");

// Upload adVideo
exports.uploadAdVideo = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const uploader = req.user.userId;
    const { ad, caption, duration } = req.body;

    const videoFile = req.files?.videoUrl?.[0];
    const thumbnailFile = req.files?.thumbnailUrl?.[0];

    // settings check skipped for now or fetched from DB
    // const maxAllowed = ...

    if (!ad) return res.status(200).json({ status: false, message: "Ad ID is required." });
    if (!caption) return res.status(200).json({ status: false, message: "Caption is required." });
    if (!videoFile) return res.status(200).json({ status: false, message: "Video file is required." });
    if (!thumbnailFile) return res.status(200).json({ status: false, message: "Thumbnail is required." });

    const videoUrl = videoFile.path;
    const thumbnailUrl = thumbnailFile.path;

    const { data: newAdVideo, error } = await supabase.from('ad_videos').insert({
      uploader_id: uploader,
      ad_id: ad,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      caption: caption
    }).select('*').single();

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "Ad video uploaded successfully.",
      data: newAdVideo,
    });
  } catch (err) {
    // if (req.files) deleteFiles(req.files); // TODO: Implement deleteFiles utility integration if needed
    console.error("Upload Error:", err);
    return res.status(500).json({ status: false, message: "Internal server error. Failed to upload AdVideo." });
  }
};

// Get adVideos
exports.getAdVideos = async (req, res) => {
  try {
    const { adId, start = 1, limit = 10, userId: queryUserId } = req.query;
    const parsedStart = parseInt(start);
    const parsedLimit = parseInt(limit);

    if (isNaN(parsedStart) || parsedStart <= 0 || isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(200).json({ status: false, message: "Invalid pagination parameters." });
    }

    const from = (parsedStart - 1) * parsedLimit;
    const to = from + parsedLimit - 1;

    let query = supabase
      .from('ad_videos')
      .select(`
            *,
            uploader:profiles!uploader_id(id, name, profile_image, created_at),
            ad:ad_listings!ad_id(title, description, price, location, ad_images)
        `)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (adId) {
      query = query.eq('ad_id', adId);
    }

    const { data: videos, error } = await query;
    if (error) throw error;

    if (!videos || videos.length === 0) {
      return res.status(200).json({ status: true, message: "Ad videos fetched successfully.", data: [] });
    }

    // Enhance with stats
    // Fetch likes count, views count, isLike, isFollow
    const videoIds = videos.map(v => v.id);
    const uploaderIds = videos.map(v => v.uploader_id);

    // Parallel fetch for stats
    // 1. Likes counts
    // 2. User liked (if queryUserId)
    // 3. User followed uploader (if queryUserId)

    const statsPromises = [
      // Total Likes (simulate count by grouping? Or just fetch all likes for these videos? N+1 or bulk)
      // Bulk: select ad_video_id from ad_video_likes where ad_video_id in videoIds
      supabase.from('ad_video_likes').select('ad_video_id').in('ad_video_id', videoIds),

      // Views counts
      supabase.from('video_views').select('video_id').in('video_id', videoIds)
    ];

    if (queryUserId) {
      statsPromises.push(
        supabase.from('ad_video_likes').select('ad_video_id').eq('user_id', queryUserId).in('ad_video_id', videoIds)
      );
      statsPromises.push(
        supabase.from('follows').select('to_user_id').eq('from_user_id', queryUserId).in('to_user_id', uploaderIds)
      );
    }

    const [likesData, viewsData, userLikesData, userFollowsData] = await Promise.all(statsPromises);

    // Process counts
    const likesCountMap = {};
    likesData.data?.forEach(l => {
      likesCountMap[l.ad_video_id] = (likesCountMap[l.ad_video_id] || 0) + 1;
    });

    // Process views? (If we need total views? Original code had totalViews only in getAdVideosOfSeller... wait.
    // getAdVideos also had totalLikes. Did it have totalViews? Original code for getAdVideos:
    // ... totalLikes: { $size: "$likesData" } ...
    // It DOES NOT seem to have totalViews in getAdVideos. getAdVideosOfSeller HAS totalViews.
    // I will add totalViews if I want, but I'll stick to original schema.
    // Wait, getAdVideos aggregation in original code:
    // $addFields: totalLikes, isLike, isFollow.
    // NO totalViews.

    // getAdVideosOfSeller aggregation:
    // totalLikes, totalViews.

    // userLikes set
    const userLikedSet = new Set(userLikesData?.data?.map(l => l.ad_video_id));

    // follows set
    const userFollowedSet = new Set(userFollowsData?.data?.map(f => f.to_user_id));

    const mappedVideos = videos.map(v => {
      // Map ad details (ad_images is array of strings or objects? Mongoose was adListing.primaryImage? 
      // Original: "adDetails.primaryImage": 1.
      // My Supabase ad_listings has `ad_images` (text[] or jsonb).
      // I'll take first image as primary.
      const primaryImage = (v.ad?.ad_images && v.ad.ad_images.length > 0) ? v.ad.ad_images[0] : "";

      return {
        _id: v.id, // Legacy ID
        videoUrl: v.video_url,
        thumbnailUrl: v.thumbnail_url,
        caption: v.caption,
        shares: v.shares,
        createdAt: v.created_at,
        totalLikes: likesCountMap[v.id] || 0,
        isLike: !!userLikedSet.has(v.id),
        isFollow: !!userFollowedSet.has(v.uploader_id),
        uploader: {
          _id: v.uploader?.id,
          name: v.uploader?.name,
          profileImage: v.uploader?.profile_image,
          registeredAt: v.uploader?.created_at
        },
        adDetails: {
          title: v.ad?.title,
          subTitle: "", // Not in new schema, maybe part of description?
          description: v.ad?.description,
          primaryImage: primaryImage,
          location: v.ad?.location,
          price: v.ad?.price
        }
      };
    });

    return res.status(200).json({
      status: true,
      message: "Ad videos fetched successfully.",
      data: mappedVideos,
    });
  } catch (err) {
    console.error("Fetch Error:", err);
    return res.status(500).json({ status: false, message: "Failed to fetch AdVideos." });
  }
};

// Fetch ad videos for a specific seller
exports.getAdVideosOfSeller = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const sellerId = req.user.userId;
    const { start = 1, limit = 10 } = req.query;
    const from = (parseInt(start) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    const { data: videos, error } = await supabase
      .from('ad_videos')
      .select(`
            *,
            ad:ad_listings!ad_id(title) 
        `)
      .eq('uploader_id', sellerId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    if (!videos || videos.length === 0) {
      return res.status(200).json({ status: true, message: "Seller ad videos fetched successfully.", data: [] });
    }

    const videoIds = videos.map(v => v.id);

    // Stats: likes and views
    const [likesData, viewsData] = await Promise.all([
      supabase.from('ad_video_likes').select('ad_video_id').in('ad_video_id', videoIds),
      supabase.from('video_views').select('video_id').in('video_id', videoIds)
    ]);

    const likesCountMap = {};
    likesData.data?.forEach(l => {
      likesCountMap[l.ad_video_id] = (likesCountMap[l.ad_video_id] || 0) + 1;
    });

    const viewsCountMap = {};
    viewsData.data?.forEach(v => {
      viewsCountMap[v.video_id] = (viewsCountMap[v.video_id] || 0) + 1;
    });

    const mapped = videos.map(v => ({
      _id: v.id,
      videoUrl: v.video_url,
      thumbnailUrl: v.thumbnail_url,
      caption: v.caption,
      shares: v.shares,
      createdAt: v.created_at,
      totalLikes: likesCountMap[v.id] || 0,
      totalViews: viewsCountMap[v.id] || 0,
      adDetails: {
        title: v.ad?.title,
        subTitle: ""
      }
    }));

    return res.status(200).json({
      status: true,
      message: "Seller ad videos fetched successfully.",
      data: mapped,
    });
  } catch (err) {
    console.error("Get Seller Videos Error:", err);
    return res.status(500).json({ status: false, message: "Failed to fetch seller ad videos." });
  }
};

// Delete adVideo
exports.deleteAdVideo = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const { id } = req.query;

    const { data: adVideo } = await supabase.from('ad_videos').select('*').eq('id', id).single();
    if (!adVideo) {
      return res.status(200).json({ status: false, message: "AdVideo not found." });
    }

    await supabase.from('ad_videos').delete().eq('id', id);

    res.status(200).json({ status: true, message: "AdVideo deleted successfully." });

    // delete files
    // if (adVideo.video_url) deleteFile(adVideo.video_url); // utility call
  } catch (err) {
    console.error("Delete Error:", err);
    return res.status(500).json({ status: false, message: "Failed to delete AdVideo." });
  }
};

// Update adVideo
exports.updateAdVideo = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const uploader = req.user.userId;
    const { adVideoId, caption } = req.body;

    if (!adVideoId) return res.status(400).json({ status: false, message: "Missing adVideoId." });

    const { data: adVideo } = await supabase.from('ad_videos').select('*').eq('id', adVideoId).eq('uploader_id', uploader).single();

    if (!adVideo) return res.status(404).json({ status: false, message: "AdVideo not found." });

    const updateData = {};
    if (caption !== undefined) updateData.caption = caption;

    const { error } = await supabase.from('ad_videos').update(updateData).eq('id', adVideoId);

    if (error) throw error;

    res.status(200).json({
      status: true,
      message: "AdVideo updated successfully.",
    });
  } catch (err) {
    console.error("Update Error:", err);
    return res.status(500).json({ status: false, message: "Failed to update AdVideo." });
  }
};


const supabase = require("../../util/supabase");

// Like/unlike ad
exports.toggleAdLike = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = req.user.userId;
    const { adId } = req.query;

    if (!adId) {
      return res.status(200).json({ status: false, message: "Ad ID is required" });
    }

    const parsedAdId = parseInt(adId); // bigint

    // Check existing
    const { data: existingLike } = await supabase
      .from('ad_likes')
      .select('*')
      .eq('ad_id', parsedAdId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      await supabase.from('ad_likes').delete().eq('id', existingLike.id);
      return res.status(200).json({ status: true, message: "Ad unliked successfully", like: false });
    }

    await supabase.from('ad_likes').insert({ ad_id: parsedAdId, user_id: userId });
    return res.status(200).json({ status: true, message: "Ad liked successfully", like: true });

  } catch (error) {
    console.error("Error toggling ad like:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all likes for a specific ad
exports.getLikesForAd = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const { adId } = req.query;

    if (!adId) {
      return res.status(200).json({ status: false, message: "adId is required" });
    }

    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { data: likes, error } = await supabase
      .from('ad_likes')
      .select(`
            *,
            user:profiles!user_id(id, name, profile_image) 
        `)
      .eq('ad_id', adId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mappedLikes = likes.map(l => ({
      _id: l.id,
      user: {
        _id: l.user.id,
        name: l.user.name,
        profileImage: l.user.profile_image,
        profileId: l.user.id
      },
      createdAt: l.created_at
    }));

    return res.status(200).json({
      status: true,
      message: "Likes fetched successfully",
      likes: mappedLikes,
    });
  } catch (error) {
    console.error("Error fetching likes:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get liked ads
exports.fetchLikedAdListingRecords = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = req.user.userId;
    const search = req?.query?.search || "All";
    const page = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Base query: AdListings
    // Join ad_likes with !inner to filter by MY likes
    let query = supabase
      .from('ad_listings')
      .select(`
            *,
            my_like:ad_likes!inner(user_id), 
            seller:profiles!seller_id(*),
            category:categories!category_id(*),
            category_hierarchy:categories!category_hierarchy(*)
        `)
      .eq('my_like.user_id', userId)
      .eq('status', 2)
      .eq('is_active', true);

    if (search !== "All") {
      query = query.ilike('title', `%${search}%`); // Only filtering by title for simplicity vs regex on multiple fields
    }

    // Sort? Mongoose sorted by viewsCount. 
    // We'll sort by created_at of the Ad for now, or maybe the Like creation time (harder to join).
    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data: ads, error } = await query;

    if (error) throw error;

    // Enrich with counts (N+1 for now, or parallel)
    // We need: likesCount, viewsCount, isLike (true), isPlacedBid, isViewed, isOfferPlaced, lastBidAmount

    const enrichedAds = await Promise.all(ads.map(async (ad) => {
      const adId = ad.id; // bigint

      // Parallel fetch stats
      const [likesCount, viewsCount, myBids, myViews, myOffers, lastBid] = await Promise.all([
        supabase.from('ad_likes').select('*', { count: 'exact', head: true }).eq('ad_id', adId),
        supabase.from('ad_views').select('*', { count: 'exact', head: true }).eq('ad_id', adId),
        supabase.from('auction_bids').select('id').eq('ad_id', adId).eq('user_id', userId).limit(1),
        supabase.from('ad_views').select('id').eq('ad_id', adId).eq('user_id', userId).limit(1), // Assuming ad_views tracks users
        supabase.from('offers').select('id').eq('ad_id', adId).eq('user_id', userId).limit(1),
        supabase.from('auction_bids').select('current_bid').eq('ad_id', adId).order('current_bid', { ascending: false }).limit(1).single()
      ]);

      return {
        _id: ad.id,
        createdAt: ad.created_at,
        attributes: ad.attributes,
        status: ad.status,
        title: ad.title,
        subTitle: ad.sub_title,
        description: ad.description,
        contactNumber: ad.contact_number,
        availableUnits: ad.available_units,
        primaryImage: ad.primary_image,
        galleryImages: ad.gallery_images,
        location: ad.location,
        saleType: ad.sale_type,
        isOfferAllowed: ad.is_offer_allowed,
        minimumOffer: ad.minimum_offer,
        price: ad.price,
        isAuctionEnabled: ad.is_auction_enabled,
        auctionStartingPrice: ad.auction_starting_price,
        auctionDurationDays: ad.auction_duration_days,
        auctionStartDate: ad.auction_start_date,
        auctionEndDate: ad.auction_end_date,
        scheduledPublishDate: ad.scheduled_publish_date,
        isReservePriceEnabled: ad.is_reserve_price_enabled,
        reservePriceAmount: ad.reserve_price_amount,
        isActive: ad.is_active,

        likesCount: likesCount.count || 0,
        viewsCount: viewsCount.count || 0,
        isLike: true, // Since we filtered by !inner join
        isPlacedBid: (myBids.data?.length || 0) > 0,
        isOfferPlaced: (myOffers.data?.length || 0) > 0,
        isViewed: (myViews.data?.length || 0) > 0,
        lastBidAmount: lastBid.data?.current_bid || 0,

        category: {
          _id: ad.category.id, // ID mapping?
          name: ad.category.name,
          image: ad.category.image
        },
        // categoryHierarchy: ... mapped ...
        seller: {
          _id: ad.seller.id,
          name: ad.seller.name,
          profileImage: ad.seller.profile_image,
          // ... other fields
        }
      };
    }));

    return res.status(200).json({
      status: true,
      message: "Liked ad listings fetched successfully",
      data: enrichedAds,
    });
  } catch (err) {
    console.error("Error in fetchLikedAdListingRecords:", err);
    return res.status(500).json({ status: false, message: "Failed to fetch liked ad listings." });
  }
};

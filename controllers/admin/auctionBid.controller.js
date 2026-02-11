const supabase = require("../../util/supabase");

// Get bids placed by a specific user
exports.fetchUserBids = async (req, res) => {
  try {
    const { userId, start, limit } = req.query;

    if (!userId) {
      return res.status(200).json({
        status: false,
        message: "Validation error: userId (query param) is required.",
      });
    }

    const page = parseInt(start) || 1;
    const limitVal = parseInt(limit) || 20;
    const from = (page - 1) * limitVal;
    const to = from + limitVal - 1;

    const { data: bids, error, count } = await supabase
      .from('auction_bids')
      .select(`
        *,
        seller:users!seller_id(id, name, profile_image),
        product:ad_listings!ad_id(
            id, title, sub_title, primary_image, attributes, auction_start_date, auction_end_date,
            category:categories(name),
            sub_category:sub_categories(name)
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = bids.map(bid => ({
      bidId: bid.id,
      currentBid: bid.current_bid,
      startingBid: bid.starting_bid,
      createdAt: bid.created_at,
      seller: bid.seller ? {
        _id: bid.seller.id,
        name: bid.seller.name,
        profileImage: bid.seller.profile_image
      } : null,
      product: bid.product ? {
        _id: bid.product.id,
        title: bid.product.title,
        subTitle: bid.product.sub_title,
        primaryImage: bid.product.primary_image,
        attributes: bid.product.attributes,
        auctionStartDate: bid.product.auction_start_date,
        auctionEndDate: bid.product.auction_end_date
      } : null,
      categoryName: bid.product?.category?.name,
      subCategoryName: bid.product?.sub_category?.name
    }));

    return res.status(200).json({
      status: true,
      message: "User auction bids fetched successfully",
      total: count,
      bids: mapped,
    });
  } catch (err) {
    console.error("User Auction Bids Error:", err);
    return res.status(500).json({ status: false, message: "Internal server error", error: err.message });
  }
};

// Get bids received by a specific seller
exports.fetchSellerAuctionBids = async (req, res) => {
  try {
    const { sellerId, start, limit } = req.query;

    if (!sellerId) {
      return res.status(200).json({ // Original code returned 400, but consistent with 200 false
        status: false,
        message: "Validation error: sellerId (query param) is required.",
      });
    }

    const page = parseInt(start) || 1;
    const limitVal = parseInt(limit) || 20;
    const from = (page - 1) * limitVal;
    const to = from + limitVal - 1;

    const { data: bids, error, count } = await supabase
      .from('auction_bids')
      .select(`
        *,
        user:users!user_id(id, name, profile_image),
        product:ad_listings!ad_id(
            id, title, sub_title, primary_image, attributes, auction_start_date, auction_end_date,
            category:categories(name),
            sub_category:sub_categories(name)
        )
      `, { count: 'exact' })
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = bids.map(bid => ({
      bidId: bid.id,
      currentBid: bid.current_bid,
      startingBid: bid.starting_bid,
      createdAt: bid.created_at,
      user: bid.user ? {
        _id: bid.user.id,
        name: bid.user.name,
        profileImage: bid.user.profile_image
      } : null,
      product: bid.product ? {
        _id: bid.product.id,
        title: bid.product.title,
        subTitle: bid.product.sub_title,
        primaryImage: bid.product.primary_image,
        attributes: bid.product.attributes,
        auctionStartDate: bid.product.auction_start_date,
        auctionEndDate: bid.product.auction_end_date
      } : null,
      categoryName: bid.product?.category?.name,
      subCategoryName: bid.product?.sub_category?.name
    }));

    return res.status(200).json({
      status: true,
      message: "Seller bids (flat list) fetched successfully",
      total: count,
      bids: mapped,
    });
  } catch (err) {
    console.error("Seller Auction Bids Error:", err);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Get all bids for a specific ad
exports.fetchBidsByAd = async (req, res) => {
  try {
    const { adId, start = 1, limit = 10 } = req.query;

    if (!adId) {
      return res.status(200).json({ status: false, message: "Invalid or missing 'adId' parameter." });
    }

    const page = parseInt(start) || 1;
    const limitVal = parseInt(limit) || 10;
    const from = (page - 1) * limitVal;
    const to = from + limitVal - 1;

    const { data: bids, error, count } = await supabase
      .from('auction_bids')
      .select(`
        id, current_bid, starting_bid, is_winning_bid, created_at,
        user:users!user_id(id, name, profile_image),
        seller:users!seller_id(id, name, profile_image)
      `, { count: 'exact' })
      .eq('ad_id', adId)
      .order('current_bid', { ascending: false }) // Highest bid first
      .range(from, to);

    if (error) throw error;

    const mapped = bids.map(bid => ({
      _id: bid.id,
      currentBid: bid.current_bid,
      startingBid: bid.starting_bid,
      isWinningBid: bid.is_winning_bid,
      createdAt: bid.created_at,
      user: bid.user ? {
        _id: bid.user.id,
        name: bid.user.name,
        profileImage: bid.user.profile_image
      } : null,
      seller: bid.seller ? {
        _id: bid.seller.id,
        name: bid.seller.name,
        profileImage: bid.seller.profile_image
      } : null,
    }));

    return res.status(200).json({
      status: true,
      message: "Bids retrieved successfully.",
      total: count,
      data: mapped,
    });
  } catch (error) {
    console.error("Error in getAdWiseBids:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error.", error: error.message });
  }
};

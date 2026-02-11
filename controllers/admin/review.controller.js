const supabase = require("../../util/supabase");

// Get Reviews
exports.listReviews = async (req, res) => {
  try {
    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { userId } = req.query;

    let query = supabase
      .from('reviews')
      .select(`
        *,
        reviewer:users!reviewer_id(name, profile_image),
        reviewee:users!reviewee_id(name, profile_image)
      `, { count: 'exact' });

    if (userId) {
      query = query.eq('reviewee_id', userId);
    }

    const { data: reviews, error, count } = await query
      .order('created_at', { ascending: false }) // Assuming created_at matches reviewedAt
      .range(from, to);

    if (error) throw error;

    const mapped = reviews.map(r => ({
      _id: r.id,
      reviewText: r.review_text,
      rating: r.rating,
      reviewedAt: r.created_at,
      reviewer: r.reviewer ? { name: r.reviewer.name, profileImage: r.reviewer.profile_image } : null,
      reviewee: r.reviewee ? { name: r.reviewee.name, profileImage: r.reviewee.profile_image } : null
    }));

    return res.status(200).json({
      status: true,
      message: "Reviews fetched successfully.",
      total: count,
      reviews: mapped,
    });
  } catch (error) {
    console.error("Error in listReviews:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Delete Review
exports.removeReview = async (req, res) => {
  try {
    const reviewId = req.query.reviewId;

    if (!reviewId) {
      return res.status(200).json({ status: false, message: "Invalid review ID" });
    }

    const { data: existing } = await supabase.from('reviews').select('id').eq('id', reviewId).single();
    if (!existing) {
      return res.status(200).json({ status: false, message: "Review not found" });
    }

    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error("Error in removeReview:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

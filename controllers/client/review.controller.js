
const supabase = require("../../util/supabase");

// Give Review
exports.giveReview = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const { revieweeId, rating, reviewText } = req.body;
    const reviewerId = req.user.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(200).json({ status: false, message: "Rating must be between 1 and 5" });
    }

    if (reviewerId === revieweeId) {
      return res.status(200).json({ status: false, message: "You cannot review yourself." });
    }

    // Upsert review using unique constraint (reviewer_id, reviewee_id)
    const { data: existingReview, error: upsetError } = await supabase
      .from('reviews')
      .upsert({
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        rating: rating,
        review_text: reviewText,
        reviewed_at: new Date().toISOString()
      }, { onConflict: 'reviewer_id, reviewee_id' })
      .select('*')
      .single();

    if (upsetError) throw upsetError;

    res.status(200).json({
      status: true,
      message: "Review submitted/updated successfully",
    });

    // Update aggregated rating for user
    // Calculate average and total count
    const { data: reviews, error: aggError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', revieweeId); // Fetch all to calculate avg? Efficient enough?

    if (!aggError && reviews) {
      const totalRating = reviews.length;
      const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating > 0 ? parseFloat((sumRating / totalRating).toFixed(2)) : 0;

      await supabase.from('profiles').update({
        total_rating: totalRating,
        average_rating: averageRating
      }).eq('id', revieweeId);
    }

  } catch (error) {
    console.error("Error in giveReview:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Get Review
exports.retrieveReview = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "Unauthorized access – user ID is required in the query." });
    }

    const userId = req.query.userId;
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const from = (start - 1) * limit;
    const to = from + limit - 1;

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
            rating, review_text, reviewed_at,
            reviewer:profiles!reviewer_id(name, profile_image)
        `)
      .eq('reviewee_id', userId)
      .order('reviewed_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = reviews.map(r => ({
      rating: r.rating,
      reviewText: r.review_text,
      reviewedAt: r.reviewed_at,
      reviewer: {
        name: r.reviewer?.name,
        profileImage: r.reviewer?.profile_image
      }
    }));

    return res.status(200).json({
      status: true,
      message: "Reviews fetched successfully.",
      receivedReviews: mapped,
    });
  } catch (error) {
    console.error("Error in getReview:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

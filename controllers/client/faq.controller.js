
const supabase = require("../../util/supabase");

// Get all FAQs
exports.retrieveFAQList = async (req, res) => {
  try {
    const { data: faqs, error } = await supabase
      .from('faqs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "FAQs fetched successfully.",
      data: faqs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

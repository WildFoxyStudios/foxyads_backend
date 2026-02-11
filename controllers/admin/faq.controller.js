const supabase = require("../../util/supabase");

// Create a new FAQ
exports.createFAQ = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!answer) {
      return res.status(200).json({ status: false, message: "Answer is required." });
    }

    const { data: faq, error } = await supabase
      .from('faqs')
      .insert({
        question,
        answer,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: true,
      message: "FAQ created successfully.",
      data: { ...faq, _id: faq.id },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Get all FAQs
exports.getAllFAQs = async (req, res) => {
  try {
    // const start = req.query.start ? parseInt(req.query.start) : 1;
    // const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const { data: faqs, error, count } = await supabase
      .from('faqs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = faqs.map(f => ({
      ...f,
      _id: f.id
    }));

    res.status(200).json({
      status: true,
      message: "FAQs fetched successfully.",
      total: count,
      data: mapped,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Update a FAQ
exports.updateFAQ = async (req, res) => {
  try {
    const { faqId, question, answer } = req.body;

    if (!faqId) {
      return res.status(200).json({ status: false, message: "FAQ ID is required." });
    }

    const { data: faq } = await supabase.from('faqs').select('id').eq('id', faqId).single();
    if (!faq) {
      return res.status(200).json({ status: false, message: "FAQ not found." });
    }

    const updates = { updated_at: new Date() };
    if (question) updates.question = question;
    if (answer) updates.answer = answer;

    const { data: updated, error } = await supabase
      .from('faqs')
      .update(updates)
      .eq('id', faqId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: true,
      message: "FAQ updated successfully.",
      data: { ...updated, _id: updated.id },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Delete a FAQ
exports.deleteFAQ = async (req, res) => {
  try {
    const { faqId } = req.query;

    if (!faqId) {
      return res.status(200).json({ status: false, message: "FAQ ID is required." });
    }

    const { data: faq } = await supabase.from('faqs').select('id').eq('id', faqId).single();
    if (!faq) {
      return res.status(200).json({ status: false, message: "FAQ not found." });
    }

    const { error } = await supabase.from('faqs').delete().eq('id', faqId);
    if (error) throw error;

    res.status(200).json({
      status: true,
      message: "FAQ deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

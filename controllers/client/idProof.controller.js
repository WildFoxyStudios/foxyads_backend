
const supabase = require("../../util/supabase");

// Get all IdProofs
exports.listIdProofs = async (req, res) => {
  try {
    const { data: idProofs, error } = await supabase
      .from('id_proofs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = idProofs.map(p => ({
      _id: p.id,
      title: p.title,
      isActive: p.is_active,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));

    return res.status(200).json({ status: true, message: "ID Proofs fetched successfully", data: mapped });
  } catch (error) {
    return res.status(500).json({ status: false, message: "Error fetching ID Proofs", error: error.message });
  }
};

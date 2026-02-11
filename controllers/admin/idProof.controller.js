const supabase = require("../../util/supabase");

// Create new IdProof
exports.createIdProof = async (req, res) => {
  try {
    const { title } = req.query; // Original checks req.query, but usually POST body? Code says req.query

    if (!title) return res.status(200).json({ status: false, message: "Title is required" });

    const { data: newIdProof, error } = await supabase
      .from('id_proofs')
      .insert({
        title: title,
        // isActive might default to true in DB or need explicit setting? 
        // Original schema probably had default. Supabase default?
        // Let's assume default is handled or set it.
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "ID Proof created successfully",
      data: { ...newIdProof, _id: newIdProof.id, isActive: newIdProof.is_active }
    });
  } catch (error) {
    console.error("Error creating ID Proof:", error);
    res.status(500).json({ status: false, message: "Error creating ID Proof", error: error.message });
  }
};

// Get all IdProofs
exports.getAllIdProofs = async (req, res) => {
  try {
    const { data: idProofs, error } = await supabase
      .from('id_proofs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = idProofs.map(proof => ({
      ...proof,
      _id: proof.id,
      isActive: proof.is_active
    }));

    res.status(200).json({
      status: true,
      message: "ID Proof fetched successfully", // Original message said "ID Proof created successfully" (copy paste error in original)
      data: mapped,
    });
  } catch (error) {
    res.status(500).json({ status: false, message: "Error fetching ID Proofs", error: error.message });
  }
};

// Update IdProof
exports.updateIdProof = async (req, res) => {
  try {
    const { title, id } = req.query;

    if (!id) return res.status(200).json({ status: false, message: "ID Proof ID is required" });

    const { data: updated, error } = await supabase
      .from('id_proofs')
      .update({
        title: title,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    // fetch error or empty data means not found or error
    if (!updated && !error) return res.status(200).json({ status: false, message: "ID Proof not found" });
    if (error) throw error;

    res.status(200).json({
      status: true,
      message: "ID Proof updated",
      data: { ...updated, _id: updated.id, isActive: updated.is_active }
    });
  } catch (error) {
    res.status(500).json({ status: false, message: "Error updating ID Proof", error: error.message });
  }
};

// Delete IdProof
exports.deleteIdProof = async (req, res) => {
  try {
    const { id } = req.query;

    // Check existence first? Or delete directly.
    // Original used findByIdAndDelete which returns null if not found.
    const { data: deleted, error } = await supabase
      .from('id_proofs')
      .delete()
      .eq('id', id)
      .select() // Need to select to know if something was deleted
      .single();

    // If no row deleted, data is null (if single check matches nothing)
    if (!deleted) return res.status(200).json({ status: false, message: "ID Proof not found" });

    res.status(200).json({ status: true, message: "ID Proof deleted" });
  } catch (error) {
    res.status(500).json({ status: false, message: "Error deleting ID Proof", error: error.message });
  }
};

// Toggle isActive status of an IdProof
exports.toggleIdProofStatus = async (req, res) => {
  try {
    const { idProofId } = req.query;

    if (!idProofId) {
      return res.status(200).json({ status: false, message: "IdProof ID is required." });
    }

    const { data: idProof } = await supabase.from('id_proofs').select('*').eq('id', idProofId).single();
    if (!idProof) {
      return res.status(200).json({ status: false, message: "IdProof not found." });
    }

    const newStatus = !idProof.is_active;

    const { data: updated, error } = await supabase
      .from('id_proofs')
      .update({ is_active: newStatus })
      .eq('id', idProofId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: `IdProof has been ${updated.is_active ? "activated" : "deactivated"}.`,
      data: { ...updated, _id: updated.id, isActive: updated.is_active },
    });
  } catch (error) {
    console.error("toggleIdProofStatus error:", error);
    return res.status(500).json({ status: false, message: "Internal server error." });
  }
};

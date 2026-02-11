
const supabase = require("../../util/supabase");
const admin = require("../../util/privateKey");

// Generate uniqueId without count
function generateVerificationId() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
  return `VER-${datePart}-${randomPart}`;
}

// Submit user verification
exports.submitUserVerification = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = req.user.userId;
    const frontFile = req.files?.idProofFront;
    const backFile = req.files?.idProofBack;
    const { idProof } = req.body;

    if (!idProof || !frontFile || !backFile) {
      return res.status(200).json({
        status: false,
        message: "ID type and both front and back images of the ID proof are required.",
      });
    }

    const [userData, existingData] = await Promise.all([
      supabase.from('profiles').select('id, fcm_token, is_verified').eq('id', userId).single(),
      supabase.from('verifications').select('status').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single()
    ]);

    const user = userData.data;
    const existing = existingData.data;

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.is_verified) {
      return res.status(200).json({ status: false, message: "Your account is already verified." });
    }

    if (existing && existing.status === 1) { // 1: Pending
      return res.status(200).json({
        status: false,
        message: "A verification request is already pending review.",
      });
    }

    if (existing && existing.status === 2) { // 2: Approved
      // Should catch is_verified check above, but consistency check
      return res.status(200).json({
        status: false,
        message: "Your account is already verified.",
      });
    }

    const uniqueId = generateVerificationId();

    const { data: verification, error } = await supabase.from('verifications').insert({
      unique_id: uniqueId,
      user_id: userId,
      id_proof: idProof,
      id_proof_front_url: frontFile ? frontFile[0].path : "",
      id_proof_back_url: backFile ? backFile[0].path : "",
      status: 1,
      submitted_at: new Date().toISOString(),
    }).select('*').single();

    if (error) throw error;

    res.status(200).json({
      status: true,
      message: "Verification details submitted successfully.",
      data: verification,
    });

    if (user.fcm_token) {
      const payload = {
        token: user.fcm_token,
        data: {
          title: "📩 Verification Request Submitted",
          body: "We've received your verification request ✅ Our team is reviewing it, and you'll be notified once it's approved 🔍",
          type: "USER_VERIFICATION_REQUEST",
        },
      };

      try {
        const adminApp = await admin;
        await adminApp.messaging().send(payload);

        await supabase.from('notifications').insert({
          user_id: user.id,
          title: payload.data.title,
          message: payload.data.body,
          send_type: "single",
          ad_id: null, // null
          date: new Date().toISOString(),
        });

      } catch (error) {
        console.log("Error sending message: ", error);
      }
    }
  } catch (error) {
    console.error("Error submitting verification:", error);
    return res.status(500).json({ status: false, message: "Something went wrong." });
  }
};

// Get user verifiation status
exports.getVerificationStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = req.user.userId;

    const { data: verification } = await supabase
      .from('verifications')
      .select('unique_id, status, reviewed_at, reviewer_remarks, submitted_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!verification) {
      return res.status(200).json({
        status: false,
        message: "No verification record found",
      });
    }

    res.status(200).json({
      status: true,
      data: {
        uniqueId: verification.unique_id,
        verificationStatus: verification.status,
        reviewedAt: verification.reviewed_at,
        reviewerRemarks: verification.reviewer_remarks,
        submittedAt: verification.submitted_at,
      },
    });
  } catch (error) {
    console.error("Error fetching verification status:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

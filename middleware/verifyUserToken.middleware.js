
const supabase = require("../util/supabase");

const verifyUserToken = async (req, res, next) => {
  // console.log("🔹 [AUTH] Received authentication request.");

  const authHeader = req.headers["authorization"] || req.headers["Authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("⚠️ [AUTH] Missing or invalid authorization header.");
    return res.status(401).json({ status: false, message: "Authorization token required" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    // console.log("🔹 [AUTH] Verifying Supabase token...");

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.warn("⚠️ [AUTH] Token verification failed:", error?.message);
      return res.status(401).json({ status: false, message: "Invalid token. Authorization failed." });
    }

    // Check if user is blocked in ‘profiles’ table
    // Assuming 'id' in profiles matches auth.users.id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_blocked, id')
      .eq('id', user.id)
      .single();

    if (profile && profile.is_blocked) {
      console.warn(`⚠️ [AUTH] User is blocked: ${user.id}`);
      return res.status(403).json({ status: false, message: "🚷 User is blocked by the admin." });
    }

    // Attach user info to request
    // We map Supabase Auth User ID to both uid and userId for compatibility
    req.user = {
      uid: user.id,
      userId: user.id, // Supabase Auth ID is the User ID (UUID)
      email: user.email,
      provider: user.app_metadata?.provider || 'email'
    };

    // console.log(`✅ [AUTH] User authentication successful. ID: ${user.id}`);
    next();

  } catch (error) {
    console.error("❌ [AUTH ERROR] Internal Server Error:", error.message);
    return res.status(401).json({
      status: false,
      message: "Authentication failed.",
    });
  }
};

module.exports = verifyUserToken;

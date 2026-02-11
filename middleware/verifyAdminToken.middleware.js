
const admin = require("firebase-admin");

// Load private key
const privateKey = global.settingJSON?.firebase_private_key || global.settingJSON?.firebasePrivateKey;

if (!privateKey) {
  console.error("❌ Firebase private key not found in global setting.");
  // Don't exit process in middleware, just log
} else {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(privateKey),
      });
      console.log("✅ Firebase Admin SDK initialized successfully");
    }
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error);
  }
}

// Supabase client
const supabase = require("../util/supabase");

const verifyAdminToken = async (req, res, next) => {
  // console.log("🔹 [AUTH] Validating Admin Firebase token...");

  const authHeader = req.headers["authorization"];
  const adminUid = req.headers["x-admin-identity"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("⚠️ [AUTH] Missing or invalid authorization header.");
    return res.status(401).json({ status: false, message: "Authorization token required" });
  }

  if (!adminUid) {
    console.warn("⚠️ [AUTH] Missing API key or Admin UID.");
    return res.status(401).json({ status: false, message: "Admin UID required for authentication." });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    // 1. Verify Firebase Token
    const decodedToken = await admin.auth().verifyIdToken(token);

    if (!decodedToken || !decodedToken.email) {
      console.warn("⚠️ [AUTH] Invalid token. Email not found.");
      return res.status(401).json({ status: false, message: "Invalid token. Authorization failed." });
    }

    // 2. Check Admin/Staff in Supabase
    // We check both tables. 
    // Note: This relies on 'admins' and 'staffs' tables existing in Supabase.

    // Check Admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('auth_id', adminUid)
      .maybeSingle();

    if (adminError && adminError.code !== 'PGRST116') { // PGRST116 is no rows, which is fine
      console.warn("Supabase Admin Check Error:", adminError);
    }

    if (adminUser) {
      req.admin = adminUser;
      // console.log(`✅ [AUTH] Admin authentication successful. Admin ID: ${adminUser.id}`);
      return next();
    }

    // Check Staff
    const { data: staffUser, error: staffError } = await supabase
      .from('staffs')
      .select('*')
      .eq('auth_id', adminUid)
      .maybeSingle();

    if (staffUser) {
      req.staff = staffUser;
      // console.log(`✅ [AUTH] Staff authentication successful. Staff ID: ${staffUser.id}`);
      return next();
    }

    console.warn("⚠️ [AUTH] Admin/Staff not found in DB.");
    return res.status(401).json({ status: false, message: "Admin or Staff not found. Authorization failed." });

  } catch (error) {
    console.error("❌ [AUTH ERROR] Token verification or DB check failed:", error.message);
    return res.status(401).json({ status: false, message: "Invalid or expired token. Authorization failed." });
  }
};

module.exports = verifyAdminToken;

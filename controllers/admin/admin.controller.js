
const supabase = require("../../util/supabase");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("myTotallySecretKey");
const { deleteFile } = require("../../util/deletefile");

// Helper to update setting file (global function from index.js)
// global.updateSettingFile is available

//check admin registered or not
exports.verifyAdminRegistration = async (req, res) => {
  try {
    // Check if any admin exists
    const { data, error } = await supabase
      .from('admins')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (error) {
      // If table doesn't exist, we assume no admin registered (or we should create table?)
      console.error("Supabase error (verifyAdminRegistration):", error);
      // If error is "relation 'admins' does not exist", we can return false (not registered)
      if (error.code === '42P01') {
        return res.status(200).json({
          status: true,
          alreadyRegistered: false,
          message: "Admin is not yet registered.",
        });
      }
      return res.status(500).json({ status: false, message: "Database Error" });
    }

    if (data) {
      return res.status(200).json({
        status: true,
        alreadyRegistered: true,
        message: "Admin is already registered.",
      });
    } else {
      return res.status(200).json({
        status: true,
        alreadyRegistered: false,
        message: "Admin is not yet registered.",
      });
    }
  } catch (error) {
    console.error("verifyAdminRegistration error:", error);
    return res.status(500).json({ status: false, message: "Internal server error." });
  }
};

//admin signUp
exports.handleAdminRegistration = async (req, res) => {
  try {
    const { authId, email, password, privateKey } = req.body;

    const trimmedUid = authId?.trim();
    const trimmedEmail = email?.trim();
    const trimmedPassword = password?.trim();

    if (!trimmedUid || !trimmedEmail || !trimmedPassword || !privateKey) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid or missing details." });
    }

    // Check existing admin
    const { data: existingAdmin } = await supabase.from('admins').select('id').limit(1).maybeSingle();

    if (existingAdmin) {
      return res.status(200).json({ status: false, message: "Admin is already registered." });
    }

    // Check settings
    let settingData = global.settingJSON;
    // We might need to fetch it from DB if global isn't fresh, but initializeSettings runs on start.

    if (!settingData || !settingData.firebasePrivateKey) {
      // Try fetching from DB
      const { data: dbSetting } = await supabase.from('settings').select('*').limit(1).single();
      if (dbSetting) settingData = dbSetting;
      else {
        // Fallback to file if DB empty
        try {
          settingData = require("../../setting");
        } catch (e) { }
      }
    }

    if (!settingData || !settingData.firebasePrivateKey) {
      return res.status(200).json({ status: false, message: "Settings document invalid or not found." });
    }

    // Insert Admin
    const { data: newAdmin, error: insertError } = await supabase
      .from('admins')
      .insert({
        auth_id: trimmedUid,
        email: trimmedEmail,
        password: cryptr.encrypt(trimmedPassword),
        // other fields like purchaseCode if needed
      })
      .select()
      .single();

    if (insertError) {
      console.error("Admin Insert Error:", insertError);
      return res.status(500).json({ status: false, message: "Failed to create admin in DB." });
    }

    res.status(200).json({
      status: true,
      message: "Admin created successfully!",
      admin: newAdmin,
    });

    if (privateKey) {
      try {
        const parsedKey = typeof privateKey === "string" ? JSON.parse(privateKey.trim()) : privateKey;

        // Update Setting in DB and File
        // 1. Update in DB:
        // We need to know WHICH setting row. Usually there's only one.
        const { data: settingRow } = await supabase.from('settings').select('id').limit(1).single();

        if (settingRow) {
          await supabase.from('settings').update({
            firebase_private_key: parsedKey // Assuming column name snake_case
          }).eq('id', settingRow.id);
        } else {
          // Create if not exists?
          // await supabase.from('settings').insert({ ... })
        }

        // 2. Update File (using global helper)
        if (global.updateSettingFile) {
          // We need to mix the new key into current settingJSON
          const newSettings = { ...global.settingJSON, firebasePrivateKey: parsedKey };
          global.updateSettingFile(newSettings);
        }

        setTimeout(() => {
          process.exit(0);
        }, 500); // 0.5s delay
        return;
      } catch (e) {
        console.error("PrivateKey Update Error:", e);
        return res.status(200).json({
          status: false,
          message: "Invalid privateKey format. Must be valid JSON.",
        });
      }
    }
  } catch (error) {
    console.error("handleAdminRegistration error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//admin login
exports.authenticateAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .select("*")
      .eq('email', email)
      .single();

    if (error || !admin) {
      return res.status(200).json({ status: false, message: "Oops! Admin not found with that email." });
    }

    if (cryptr.decrypt(admin.password) !== password) {
      return res.status(200).json({ status: false, message: "Oops! Password doesn't match!" });
    }

    return res.status(200).json({
      status: true,
      message: "Admin has successfully logged in.",
      admin,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//update admin profile
exports.modifyAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin.id; // Supabase uses 'id' not '_id' typically, check schema

    // check exist
    const { data: admin, error } = await supabase.from('admins').select('*').eq('id', adminId).single();

    if (!admin) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Admin not found!" });
    }

    const updateFields = {
      name: req.body?.name || admin.name,
      email: req.body?.email ? req.body.email.trim() : admin.email,
    };

    if (req.file) {
      if (admin.image) {
        // Should delete from storage or filesystem? Original code used `deleteFile` utility (filesystem).
        // If path is local, deleteFile works.
        deleteFile(admin.image);
      }
      updateFields.image = req.file.path;
    }

    const { data: updatedAdmin, error: updateError } = await supabase
      .from('admins')
      .update(updateFields)
      .eq('id', adminId)
      .select()
      .single();

    if (updateError) throw updateError;

    updatedAdmin.password = cryptr.decrypt(updatedAdmin.password);

    return res.status(200).json({
      status: true,
      message: "Admin profile has been updated.",
      data: updatedAdmin,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get admin profile
exports.retrieveAdminDetails = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const adminId = req.admin.id;

    const { data: admin, error } = await supabase.from('admins').select('*').eq('id', adminId).single();

    if (!admin) {
      return res.status(200).json({ status: false, message: "Admin not found." });
    }

    admin.password = cryptr.decrypt(admin.password);

    return res.status(200).json({
      status: true,
      message: "Admin profile retrieved successfully!",
      data: admin,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//update password
exports.updatePassword = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const { data: admin } = await supabase.from('admins').select('*').eq('id', adminId).single();

    if (!admin) {
      return res.status(200).json({ status: false, message: "Admin does not found." });
    }

    if (!req.body.oldPass || !req.body.newPass || !req.body.confirmPass) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    if (cryptr.decrypt(admin.password) !== req.body.oldPass) {
      return res.status(200).json({
        status: false,
        message: "Oops! Password doesn't match!",
      });
    }

    if (req.body.newPass !== req.body.confirmPass) {
      return res.status(200).json({
        status: false,
        message: "Oops! New Password and Confirm Password don't match!",
      });
    }

    const newEncryptedPassword = cryptr.encrypt(req.body.newPass);

    const { data: updatedAdmin, error } = await supabase
      .from('admins')
      .update({ password: newEncryptedPassword })
      .eq('id', adminId)
      .select()
      .single();

    if (error) throw error;

    updatedAdmin.password = cryptr.decrypt(updatedAdmin.password);

    return res.status(200).json({
      status: true,
      message: "Password has been changed by the admin.",
      data: updatedAdmin,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//set Password
exports.initiatePasswordReset = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const { data: admin } = await supabase.from('admins').select('*').eq('id', adminId).single();

    if (!admin) {
      return res.status(200).json({ status: false, message: "Admin does not found." });
    }

    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(200).json({
        status: false,
        message: "Oops! New Password and Confirm Password don't match!",
      });
    }

    const newEncryptedPassword = cryptr.encrypt(newPassword);

    const { data: updatedAdmin, error } = await supabase
      .from('admins')
      .update({ password: newEncryptedPassword })
      .eq('id', adminId)
      .select()
      .single();

    if (error) throw error;

    updatedAdmin.password = cryptr.decrypt(updatedAdmin.password);

    return res.status(200).json({
      status: true,
      message: "Password has been updated Successfully.",
      data: updatedAdmin,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//verify email
exports.handleAdminEmailVerification = async (req, res) => {
  try {
    if (!req.query.email) {
      return res.status(200).json({ status: false, message: "Email is required." });
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .select('id')
      .eq('email', req.query.email.trim())
      .maybeSingle();

    if (!admin) {
      return res.status(200).json({ status: false, message: "Admin not found with the provided email." });
    }

    return res.status(200).json({
      status: true,
      message: "Admin email verified successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};


const supabase = require("../../util/supabase");

//Cryptr
const Cryptr = require("cryptr");
const cryptr = new Cryptr("myTotallySecretKey");

//deletefile
const { deleteFile } = require("../../util/deletefile");

//unique Id
const { generateUniqueProfileId } = require("../../util/generateUserUniqueId");

//validatePackageExpiration
const validatePackageExpiration = require("../../util/validatePackageExpiration");

//deleteUserDataById
const deleteUserDataById = require("../../util/deleteUserDataById");


//check the user is exists or not
exports.verifyUserExistence = async (req, res) => {
  try {
    const { loginType } = req.query;
    const type = Number(loginType);

    if (!loginType || ![1, 2, 3, 4].includes(type)) {
      return res.status(200).json({
        status: false,
        message: "Invalid or missing loginType. Must be one of 1 (mobile), 2 (Google), 3 (Apple), 4 (Email+Password).",
      });
    }

    if (!req.body || typeof req.body !== "object") {
      return res.status(200).json({
        status: false,
        message: "Invalid request body.",
      });
    }

    let user = null;
    let query = supabase.from('profiles').select('*');

    switch (type) {
      case 1: // Mobile Login
        if (!req.body.mobileNumber) {
          return res.status(200).json({ status: false, message: "mobileNumber is required." });
        }
        query = query.eq('phone_number', req.body.mobileNumber.trim()).eq('login_type', 1);
        break;

      case 2: // Google Login
        if (!req.body.email) {
          return res.status(200).json({ status: false, message: "email is required." });
        }
        query = query.eq('email', req.body.email.trim()).eq('login_type', 2);
        break;

      case 3: // Apple Login
        if (!req.body.email) {
          return res.status(200).json({ status: false, message: "email is required." });
        }
        query = query.eq('email', req.body.email.trim()).eq('login_type', 3);
        break;

      case 4: // Email + Password
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(200).json({
            status: false,
            message: "email and password are required for loginType 4.",
          });
        }
        query = query.eq('email', email.trim()).eq('login_type', 4);
        break;

      default:
        return res.status(200).json({
          status: false,
          message: "Unsupported loginType.",
        });
    }

    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      throw error;
    }
    user = data;

    if (type === 4 && user) {
      // Password check logic if needed
    }

    console.log("req.query: ", req.query);
    console.log("req.body: ", req.body);

    if (user) {
      return res.status(200).json({
        status: true,
        message: "User login successful.",
        isLogin: true,
      });
    } else {
      return res.status(200).json({
        status: true,
        message: "User not found. Please sign up.",
        isLogin: false,
      });
    }
  } catch (error) {
    console.error("checkUserExistence error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//user login and sign up
exports.loginOrSignupUser = async (req, res) => {
  try {
    if (!req.body) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Request body is missing." });
    }

    const { loginType, fcmToken, email, password, phoneNumber, name, profileImage, authIdentity, isContactInfoVisible, isNotificationsAllowed, address } = req.body;

    if (!authIdentity || loginType === undefined || !fcmToken) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Oops! Invalid details!!" });
    }

    const { uid, provider } = req.user;

    // Check if user exists
    let { data: user, error } = await supabase.from('profiles').select('*').eq('firebase_uid', uid).single();
    if (error && error.code !== 'PGRST116') throw error;


    if (user) {
      if (user.is_blocked) {
        if (req.file) deleteFile(req.file);
        return res.status(403).json({ status: false, message: "🚷 User is blocked by the admin." });
      }

      // Update user
      const updates = {
        name: name?.trim() || user.name,
        profile_image: req.file ? req.file.path : profileImage || user.profile_image,
        fcm_token: fcmToken || user.fcm_token,
        last_login_at: new Date().toISOString()
      };

      const { data: updatedUser, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({ status: true, message: "User logged in.", user: updatedUser, signUp: false });
    } else {
      const userUniqueId = await generateUniqueProfileId();

      const newUser = {
        id: uid,
        login_type: loginType,
        name: name || "",
        phone_number: phoneNumber?.trim() || "",
        email: email?.trim() || "",
        address: address?.trim() || "",
        profile_image: req.file ? req.file.path : profileImage,
        fcm_token: fcmToken,
        auth_identity: authIdentity,
        profile_id: userUniqueId,
        firebase_uid: uid,
        auth_provider: provider,
        is_notifications_allowed: isNotificationsAllowed === "true" || isNotificationsAllowed === true,
        is_contact_info_visible: isContactInfoVisible === "true" || isContactInfoVisible === true,
        last_login_at: new Date().toISOString(),
        registered_at: new Date().toISOString(),
      };

      const { data: createdUser, error: createError } = await supabase
        .from('profiles')
        .insert(newUser)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      res.status(200).json({
        status: true,
        message: "A new user has registered an account.",
        signUp: true,
        user: createdUser,
      });
    }
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.error("authenticateOrRegisterUnifiedUser error:", error);
    res.status(500).json({ status: false, message: "Internal Server Error: " + error.message });
  }
};

//update user's profile
exports.updateProfileInfo = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      if (req.file) deleteFile(req.file);
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = req.user.userId;

    const { name, email, phoneNumber, address, isNotificationsAllowed, isContactInfoVisible } = req.body;

    // Check user existence
    const { data: user, error: fetchError } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (fetchError || !user) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "User not found" });
    }

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phoneNumber) updates.phone_number = phoneNumber;
    if (address) updates.address = address;

    if (isNotificationsAllowed !== undefined) {
      updates.is_notifications_allowed = isNotificationsAllowed === "true" || isNotificationsAllowed === true;
    }

    if (isContactInfoVisible !== undefined) {
      updates.is_contact_info_visible = isContactInfoVisible === "true" || isContactInfoVisible === true;
    }

    if (req.file) {
      if (user.profile_image) {
        deleteFile(user.profile_image);
      }
      updates.profile_image = req.file.path;
    }

    const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', userId);

    if (updateError) throw updateError;

    res.status(200).json({ status: true, message: "Profile updated successfully" });

  } catch (err) {
    if (req.file) deleteFile(req.file);
    console.error(err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

//get user's profile
exports.fetchUserProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = req.user.userId;

    let { data: user, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "The user has retrieved their profile.",
      user,
    });
  } catch (error) {
    console.error("fetchUserProfile error:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//update password
exports.resetCurrentPassword = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const { oldPass, newPass, confirmPass } = req.query;

    if (!oldPass || !newPass || !confirmPass) {
      return res.status(200).json({ status: false, message: "All password fields are required." });
    }

    return res.status(501).json({ status: false, message: "Password reset should be handled via Supabase Client." });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//set password ( forgot password )
exports.initiatePasswordReset = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.query;

    if (!email) {
      return res.status(200).json({ status: false, message: "Email is required." });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(200).json({ status: false, message: "Both password fields are required." });
    }

    return res.status(501).json({ status: false, message: "Please use Supabase Auth 'Forgot Password' flow on client." });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//toggling the user's permission status
exports.manageUserPermission = async (req, res, next) => {
  try {
    const userUid = req.headers["x-meta-auth-id"];
    const { type } = req.query;

    // Map backend legacy field names to DB columns
    const fieldMap = {
      'isNotificationsAllowed': 'is_notifications_allowed',
      'isContactInfoVisible': 'is_contact_info_visible'
    };
    const dbField = fieldMap[type];

    if (!userUid) {
      console.warn("⚠️ [AUTH] User UID missing.");
      return res.status(401).json({ status: false, message: "User UID required for authentication." });
    }

    if (!type || !dbField) {
      return res.status(200).json({ status: false, message: "Invalid or missing permission type." });
    }

    // Get current value
    const { data: user, error } = await supabase.from('profiles').select(dbField).eq('firebase_uid', userUid).single();

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    const newValue = !user[dbField];
    const { error: updateError } = await supabase.from('profiles').update({ [dbField]: newValue }).eq('firebase_uid', userUid);

    if (updateError) throw updateError;

    return res.status(200).json({
      status: true,
      message: `${type} has been ${newValue ? "enabled" : "disabled"} successfully.`,
    });
  } catch (error) {
    console.error("❌ Error toggling permission:", error);
    return res.status(500).json({ status: false, message: "An error occurred while updating permission." });
  }
};

//delete user account
exports.deactivateAccount = async (req, res) => {
  try {
    const userUid = req.headers["x-meta-auth-id"];
    if (!userUid) {
      console.warn("⚠️ [AUTH] User UID.");
      return res.status(401).json({ status: false, message: "User UID required for authentication." });
    }

    const { data: user, error } = await supabase.from('profiles').select('*').eq('firebase_uid', userUid).single();

    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    // Delete from Supabase Auth (admin)
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteAuthError) console.error("Failed to delete auth user:", deleteAuthError.message);

    // Delete from profiles (Cascade should handle relations, but manual cleanup is good)
    const { error: deleteProfileError } = await supabase.from('profiles').delete().eq('id', user.id);

    res.status(200).json({
      status: true,
      message: "User and related data successfully deleted.",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

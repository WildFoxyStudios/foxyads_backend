const supabase = require("../../util/supabase");
const firebaseAdminPromise = require("../../util/privateKey");
const Cryptr = require("cryptr");
const { deleteFile } = require("../../util/deletefile"); // Not used in original but might be needed? Original didn't use it.

// Initialize Cryptr (Same key as original)
const cryptr = new Cryptr("myTotallySecretKey");

// Create Staff
exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, role, authId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ status: false, message: "All fields (name, email, password, role) are required." });
    }

    // Check Role Existence
    const { data: roleExists } = await supabase.from('roles').select('id').eq('id', role).single();
    if (!roleExists) {
      return res.status(400).json({ status: false, message: "Invalid role selected." });
    }

    // Check Email Existence in Supabase
    const { data: emailExists } = await supabase.from('staffs').select('id').eq('email', email.toLowerCase().trim()).single();
    if (emailExists) {
      return res.status(400).json({ status: false, message: "Email already in use." });
    }

    const firebaseAdmin = await firebaseAdminPromise;
    let firebaseUser;
    try {
      firebaseUser = await firebaseAdmin.auth().createUser({
        email: email.toLowerCase().trim(),
        password: password,
        disabled: false,
      });
    } catch (firebaseError) {
      console.error("Firebase user creation failed:", firebaseError);
      return res.status(400).json({
        status: false,
        message: firebaseError.message || "Failed to create Firebase user",
      });
    }

    const { data: staff, error } = await supabase
      .from('staffs')
      .insert({
        auth_id: firebaseUser?.uid,
        name: name,
        email: email.toLowerCase().trim(),
        password: cryptr.encrypt(password),
        role: role, // Assuming UUID
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) {
      // Cleanup Firebase user if DB insert fails? original didn't.
      throw error;
    }

    return res.status(200).json({
      status: true,
      message: "Staff created successfully.",
      staff: { ...staff, _id: staff.id, isActive: staff.is_active }
    });

  } catch (err) {
    console.error("Create Staff Error:", err);
    return res.status(500).json({ status: false, message: "Server error." });
  }
};

// Update Staff
exports.updateStaff = async (req, res) => {
  try {
    const { staffId, name, email, password, roleId, isActive } = req.body;

    if (!staffId) {
      return res.status(200).json({ status: false, message: "Invalid Staff ID." });
    }

    const { data: staff, error: fetchError } = await supabase
      .from('staffs')
      .select('*')
      .eq('id', staffId)
      .single();

    const firebaseAdmin = await firebaseAdminPromise;

    if (!staff) {
      return res.status(200).json({ status: false, message: "Staff not found." });
    }

    const updates = { updated_at: new Date() };

    if (email && email !== staff.email) {
      const cleanEmail = email.toLowerCase().trim();
      const { data: emailExists } = await supabase
        .from('staffs')
        .select('id')
        .eq('email', cleanEmail)
        .neq('id', staffId)
        .single();

      if (emailExists) {
        return res.status(200).json({ status: false, message: "Email already in use." });
      }

      updates.email = cleanEmail;

      if (staff.auth_id) {
        try {
          await firebaseAdmin.auth().updateUser(staff.auth_id, { email: cleanEmail });
        } catch (e) {
          console.error("Firebase email update failed:", e);
        }
      }
    }

    if (password) {
      updates.password = cryptr.encrypt(password);

      if (staff.auth_id) {
        try {
          await firebaseAdmin.auth().updateUser(staff.auth_id, { password });
        } catch (e) {
          console.error("Firebase password update failed:", e);
        }
      }
    }

    if (name) updates.name = name;
    if (typeof isActive !== "undefined") updates.is_active = isActive === 'true' || isActive === true;
    if (roleId) updates.role = roleId;

    const { data: updated, error: updateError } = await supabase
      .from('staffs')
      .update(updates)
      .eq('id', staffId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Decrypt password for response? Original did.
    let decryptedPassword = "DECRYPTION_FAILED";
    try {
      decryptedPassword = cryptr.decrypt(updated.password);
    } catch (e) { }

    return res.status(200).json({
      status: true,
      message: "Staff updated successfully.",
      data: {
        ...updated,
        _id: updated.id,
        isActive: updated.is_active,
        password: decryptedPassword,
      },
    });
  } catch (error) {
    console.error("Update Staff Error:", error);
    res.status(500).json({ status: false, message: "Internal server error." });
  }
};

// Toggle Staff Active Status
exports.updateStaffActiveState = async (req, res) => {
  try {
    const { staffId } = req.query;

    if (!staffId) {
      return res.status(200).json({ status: false, message: "Staff ID is required." });
    }

    const { data: staff } = await supabase.from('staffs').select('is_active').eq('id', staffId).single();
    if (!staff) {
      return res.status(200).json({ status: false, message: "Staff not found." });
    }

    const newStatus = !staff.is_active;
    const { data: updated, error } = await supabase
      .from('staffs')
      .update({ is_active: newStatus })
      .eq('id', staffId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: `Staff has been ${updated.is_active ? "activated" : "deactivated"} successfully.`,
      data: { ...updated, _id: updated.id, isActive: updated.is_active },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: "An error occurred while updating staff active status.",
    });
  }
};

// Delete Staff
exports.deleteStaff = async (req, res) => {
  try {
    const { staffId } = req.query;

    if (!staffId) {
      return res.status(200).json({ status: false, message: "Invalid Staff ID." });
    }

    const { data: staff } = await supabase.from('staffs').select('*').eq('id', staffId).single();

    if (!staff) {
      return res.status(200).json({ status: false, message: "Staff not found." });
    }

    const { error: deleteError } = await supabase.from('staffs').delete().eq('id', staffId);
    if (deleteError) throw deleteError;

    res.status(200).json({ status: true, message: "Staff deleted successfully." });

    if (staff.auth_id) { // snake_case
      try {
        const firebaseAdmin = await firebaseAdminPromise;
        await firebaseAdmin.auth().deleteUser(staff.auth_id);
        console.log(`✅ Firebase staff deleted: ${staff.auth_id}`);
      } catch (err) {
        console.error(`❌ Failed to delete Firebase staff ${staff.auth_id}:`, err.message);
      }
    }
  } catch (error) {
    console.error("Delete Staff Error:", error);
    res.status(500).json({ status: false, message: "Internal server error." });
  }
};

// Get All Staff
exports.getStaffList = async (req, res) => {
  try {
    const page = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Join with roles
    const { data: staffList, error, count } = await supabase
      .from('staffs')
      .select(`
            id, name, email, password, is_active, created_at, role,
            roleDetails:roles!role(id, name, permissions, is_active)
        `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const decryptedList = staffList.map((staff) => ({
      ...staff,
      _id: staff.id,
      isActive: staff.is_active,
      role: staff.roleDetails, // Mongoose populated 'role' field, replacing ID.
      password: (() => {
        try {
          return cryptr.decrypt(staff.password);
        } catch (e) {
          console.error("Password decryption failed:", e);
          return "DECRYPTION_FAILED";
        }
      })(),
    }));

    res.status(200).json({
      status: true,
      message: "Staff list retrieved successfully.",
      total: count,
      data: decryptedList,
    });
  } catch (err) {
    console.error("Get Staff List Error:", err);
    res.status(500).json({ status: false, message: "Internal server error." });
  }
};

// Login Staff
exports.loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: staff, error } = await supabase
      .from('staffs')
      .select(`
            id, name, email, password, role,
            roleDetails:roles!role(name, permissions)
        `)
      .eq('email', email)
      .maybeSingle();

    if (!staff) {
      return res.status(200).json({ status: false, message: "Staff not found" });
    }

    if (!staff.password) {
      return res.status(200).json({ status: false, status: false, message: "Password not found!" });
    }

    if (cryptr.decrypt(staff.password) !== password) {
      return res.status(200).json({ status: false, status: false, message: "Oops! Password doesn't match!" });
    }

    return res.status(200).json({
      status: true,
      message: "Login successful",
      staff: {
        _id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.roleDetails ? staff.roleDetails.name : "",
        permissions: staff.roleDetails ? staff.roleDetails.permissions : [],
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

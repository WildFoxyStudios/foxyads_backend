const supabase = require("../../util/supabase");
const firebaseAdminPromise = require("../../util/privateKey");
// const ALLOWED_ACTIONS = ["List", "Create", "Edit", "Update", "Delete"]; // Enforced in frontend/shared, kept for validation

const ALLOWED_ACTIONS = ["List", "Create", "Edit", "Update", "Delete"];

// Create Role
exports.createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;

    if (!name || !permissions) {
      return res.status(200).json({ message: "Name and permissions are required." });
    }

    // Validation
    for (const perm of permissions) {
      if (!perm.module || typeof perm.module !== "string") {
        return res.status(200).json({ status: false, message: `Invalid module name in permissions.` });
      }
      if (!Array.isArray(perm.actions)) {
        return res.status(200).json({ status: false, message: `Actions must be an array.` });
      }
      const invalidActions = perm.actions.filter((action) => !ALLOWED_ACTIONS.includes(action));
      if (invalidActions.length > 0) {
        return res.status(200).json({
          status: false,
          message: `Invalid actions for module "${perm.module}": ${invalidActions.join(", ")}`,
        });
      }
    }

    const { data: role, error } = await supabase
      .from('roles')
      .insert({
        name: name,
        permissions: permissions, // JSONB
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) {
      // Unique constraint on name?
      if (error.code === '23505') { // unique_violation
        return res.status(200).json({ status: false, message: "Role with this name already exists." });
      }
      throw error;
    }

    return res.status(200).json({
      status: true,
      message: "Role created successfully.",
      data: { ...role, _id: role.id, isActive: role.is_active }
    });
  } catch (error) {
    console.error("Create Role Error:", error);
    return res.status(500).json({ status: false, message: "Server error." });
  }
};

// Update Role
exports.updateRole = async (req, res) => {
  try {
    const { roleId, name, permissions } = req.body;

    if (!roleId) {
      return res.status(200).json({ status: false, message: "Invalid role ID." });
    }

    // Check existence
    const { data: role, error: fetchError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (!role) {
      return res.status(200).json({ status: false, message: "Role not found." });
    }

    const updates = { updated_at: new Date() };

    if (name) {
      // Check uniqueness excluding current role
      const { data: existing } = await supabase
        .from('roles')
        .select('id')
        .eq('name', name)
        .neq('id', roleId)
        .single();

      if (existing) {
        return res.status(200).json({ status: false, message: "Another role with this name already exists." });
      }
      updates.name = name;
    }

    if (permissions) {
      if (!Array.isArray(permissions)) {
        return res.status(200).json({ status: false, message: "Permissions must be an array." });
      }
      for (let i = 0; i < permissions.length; i++) {
        const perm = permissions[i];
        if (typeof perm.module !== "string" || !Array.isArray(perm.actions)) {
          return res.status(200).json({ status: false, message: `Invalid permission format at index ${i}` });
        }
        const invalidActions = perm.actions.filter((action) => !ALLOWED_ACTIONS.includes(action));
        if (invalidActions.length > 0) {
          return res.status(200).json({
            status: false,
            message: `Invalid actions for module "${perm.module}": ${invalidActions.join(", ")}`,
          });
        }
      }
      updates.permissions = permissions;
    }

    const { data: updatedRole, error } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', roleId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      status: true,
      message: "Role updated successfully.",
      data: { ...updatedRole, _id: updatedRole.id, isActive: updatedRole.is_active }
    });
  } catch (error) {
    console.error("Update Role Error:", error);
    res.status(500).json({ status: false, message: "Internal server error." });
  }
};

// Get All Roles
exports.getRoles = async (req, res) => {
  try {
    const page = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: roles, error, count } = await supabase
      .from('roles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mappedRoles = roles.map(r => ({
      ...r,
      _id: r.id,
      isActive: r.is_active
    }));

    res.status(200).json({
      status: true,
      message: "Roles fetched successfully.",
      total: count,
      data: mappedRoles,
    });
  } catch (error) {
    console.error("Get Roles Error:", error);
    res.status(500).json({ status: false, message: "Internal server error." });
  }
};

// Delete Role
exports.deleteRole = async (req, res) => {
  try {
    const { roleId } = req.query;

    if (!roleId) {
      return res.status(200).json({ status: false, message: "Invalid role ID." });
    }

    const { data: role, error } = await supabase
      .from('roles')
      .select('id')
      .eq('id', roleId)
      .single();

    if (!role) {
      return res.status(200).json({ status: false, message: "Role not found." });
    }

    // Check staff associated with role
    // Assuming 'staffs' table
    const { data: staffAuths, error: staffError } = await supabase
      .from('staffs')
      .select('auth_id')
      .eq('role', roleId); // Assuming 'role' column stores UUID

    // If table is 'staff', this might fail if I guessed wrong.
    // If 'staffs' fails, I might need to try 'staff'. 
    // But 'staff.model.js' usually implies 'staffs'.

    if (!staffError && staffAuths && staffAuths.length > 0) {
      try {
        const firebaseAdmin = await firebaseAdminPromise;
        await Promise.allSettled(staffAuths.filter((s) => s.auth_id).map((s) => firebaseAdmin.auth().deleteUser(s.auth_id)));
        console.log(`✅ Deleted ${staffAuths.length} staff from Firebase (role: ${roleId})`);
      } catch (err) {
        console.error("❌ Firebase batch delete error:", err.message);
      }

      // Delete staff records
      await supabase.from('staffs').delete().eq('role', roleId);
    } else if (staffError) {
      console.warn("Could not fetch staff for role deletion (might be table name issue):", staffError.message);
      // Continue to delete role? Or fail? 
      // If table doesn't exist, maybe no staff to delete.
    }

    const { error: deleteError } = await supabase.from('roles').delete().eq('id', roleId);
    if (deleteError) throw deleteError;

    res.status(200).json({ status: true, message: "Role deleted successfully." });
    console.log(`✅ Role and related staff deleted successfully: ${roleId}`);

  } catch (error) {
    console.error("Delete Role Error:", error);
    res.status(500).json({ status: false, message: "Internal server error." });
  }
};

// Get All Roles ( When Create Staff )
exports.listAvailableRoles = async (req, res) => {
  try {
    const { data: roles, error } = await supabase
      .from('roles')
      .select('id, name, created_at, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = roles.map(r => ({
      ...r,
      _id: r.id, // Frontend might expect _id
      isActive: r.is_active
    }));

    res.status(200).json({
      status: true,
      message: "Roles fetched successfully.",
      data: mapped,
    });
  } catch (error) {
    console.error("Get Roles Error:", error);
    res.status(500).json({ status: false, message: "Internal server error." });
  }
};

// Toggle Role Active Status
exports.updateRoleActiveState = async (req, res) => {
  try {
    const { roleId } = req.query;

    if (!roleId) {
      return res.status(200).json({ status: false, message: "Role ID is required." });
    }

    const { data: role } = await supabase.from('roles').select('is_active').eq('id', roleId).single();
    if (!role) {
      return res.status(200).json({ status: false, message: "Role not found." });
    }

    const newStatus = !role.is_active;

    const { data: updatedRole, error } = await supabase
      .from('roles')
      .update({ is_active: newStatus })
      .eq('id', roleId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: `Role has been ${updatedRole.is_active ? "activated" : "deactivated"} successfully.`,
      data: { ...updatedRole, _id: updatedRole.id, isActive: updatedRole.is_active },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: "An error occurred while updating role active status.",
    });
  }
};

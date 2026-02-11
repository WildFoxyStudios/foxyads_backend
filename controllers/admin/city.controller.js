const supabase = require("../../util/supabase");

// Create City
exports.createCity = async (req, res) => {
  try {
    const { name, latitude, longitude, stateName } = req.body;

    if (!name || latitude === undefined || longitude === undefined || !stateName) {
      return res.status(200).json({
        status: false,
        message: "Required fields: name, latitude, longitude, stateName",
      });
    }

    // Find or Create State
    let { data: state } = await supabase
      .from('states')
      .select('id, name')
      .eq('name', stateName.trim())
      .maybeSingle();

    if (!state) {
      // Create state if not exists (minimal fields)
      const { data: newState, error: createError } = await supabase
        .from('states')
        .insert({
          name: stateName.trim(),
          state_code: "", // Required logic from model, default empty
          type: "auto",
          latitude: 0,
          longitude: 0
        })
        .select()
        .single();
      if (createError) throw createError;
      state = newState;
    }

    const { data: existing } = await supabase
      .from('cities')
      .select('id')
      .eq('name', name.trim())
      .eq('state_id', state.id)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({
        status: false,
        message: "City with this name already exists in the selected state",
      });
    }

    const { data: city, error: cityError } = await supabase
      .from('cities')
      .insert({
        state_id: state.id,
        name: name.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        created_at: new Date(),
        updated_at: new Date()
      })
      .select(`
            *,
            stateDetails:states(id, name)
        `)
      .single();

    if (cityError) throw cityError;

    const responseData = {
      ...city,
      _id: city.id,
      state_id: city.stateDetails,
    };

    return res.status(200).json({
      status: true,
      message: "City created successfully",
      data: responseData,
    });
  } catch (err) {
    console.error("City creation failed:", err);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Update City
exports.updateCity = async (req, res) => {
  try {
    const { cityId } = req.body;

    if (!cityId) {
      return res.status(200).json({ status: false, message: "City ID is required" });
    }

    const { data: city, error: fetchError } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .single();

    if (!city) {
      return res.status(200).json({ status: false, message: "City not found" });
    }

    const { name, latitude, longitude, stateName } = req.body;
    const updates = { updated_at: new Date() };

    let state;
    if (stateName) {
      const { data: foundState } = await supabase.from('states').select('id, name').eq('name', stateName.trim()).maybeSingle();
      if (foundState) {
        state = foundState;
      } else {
        const { data: newState } = await supabase.from('states').insert({
          name: stateName.trim(),
          state_code: "",
          type: "auto",
          latitude: 0,
          longitude: 0
        }).select().single();
        state = newState;
      }
      updates.state_id = state.id;
    } else {
      // Need state_id for uniqueness check if name changes? 
      // Original logic checks uniqueness if name changes.
      state = { id: city.state_id };
    }

    if (name) {
      const { data: existing } = await supabase
        .from('cities')
        .select('id')
        .eq('name', name.trim())
        .eq('state_id', state.id)
        .neq('id', cityId)
        .maybeSingle();

      if (existing) {
        return res.status(200).json({
          status: false,
          message: "City with this name already exists in the selected state",
        });
      }
      updates.name = name.trim();
    }

    if (latitude !== undefined) updates.latitude = parseFloat(latitude);
    if (longitude !== undefined) updates.longitude = parseFloat(longitude);

    const { data: updated, error: updateError } = await supabase
      .from('cities')
      .update(updates)
      .eq('id', cityId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      status: true,
      message: "City updated successfully",
      data: { ...updated, _id: updated.id },
    });
  } catch (err) {
    console.error("Update City Error:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to update city",
      error: err.message,
    });
  }
};

// Get All Cities
exports.getAllCities = async (req, res) => {
  try {
    const page = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: cities, error, count } = await supabase
      .from('cities')
      .select(`
            *,
            stateDetails:states(id, name)
        `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = cities.map(c => ({
      ...c,
      _id: c.id,
      state_id: c.stateDetails
    }));

    return res.status(200).json({
      status: true,
      message: "Cities retrieved successfully",
      total: count,
      data: mapped,
    });
  } catch (err) {
    console.error("Error fetching cities:", err);
    res.status(500).json({
      status: false,
      message: "Error fetching cities",
      error: err.message,
    });
  }
};

// Delete City
exports.deleteCity = async (req, res) => {
  try {
    const { cityId } = req.query;

    if (!cityId) {
      return res.status(200).json({ status: false, message: "City ID is required" });
    }

    const { data: city } = await supabase.from('cities').select('id').eq('id', cityId).single();

    if (!city) {
      return res.status(200).json({ status: false, message: "City not found" });
    }

    const { error } = await supabase.from('cities').delete().eq('id', cityId);
    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "City deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting city:", err);
    res.status(500).json({
      status: false,
      message: "Error deleting city",
      error: err.message,
    });
  }
};

// Get All Cities ( dropdown )
exports.fetchCities = async (req, res) => {
  try {
    const { data: cities, error } = await supabase
      .from('cities')
      .select(`
            *,
            stateDetails:states(id, name)
        `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = cities.map(c => ({
      ...c,
      _id: c.id,
      state_id: c.stateDetails
    }));

    return res.status(200).json({
      status: true,
      message: "Cities retrieved successfully",
      data: mapped,
    });
  } catch (err) {
    console.error("Error fetching cities:", err);
    res.status(500).json({
      status: false,
      message: "Error fetching cities",
      error: err.message,
    });
  }
};

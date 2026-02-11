const supabase = require("../../util/supabase");

// Create state
exports.createState = async (req, res) => {
  try {
    const { name, state_code, latitude, longitude, countryName } = req.body;

    if (!name || !state_code || !countryName) {
      return res.status(200).json({
        status: false,
        message: "Name, state_code, and countryName are required",
      });
    }

    const trimmedName = name.trim();
    const trimmedCode = state_code.trim();
    const trimmedCountryName = countryName.trim();

    // Find or Create Country
    let { data: country, error: countryError } = await supabase
      .from('countries')
      .select('id, name')
      .eq('name', trimmedCountryName)
      .maybeSingle();

    if (!country) {
      // Create country if not exists (as per original logic)
      // Note: Original only provided name. Other fields null?
      const { data: newCountry, error: createError } = await supabase
        .from('countries')
        .insert({ name: trimmedCountryName })
        .select()
        .single();
      if (createError) throw createError;
      country = newCountry;
    }

    const { data: existingState } = await supabase
      .from('states')
      .select('id')
      .eq('name', trimmedName)
      .eq('country_id', country.id)
      .maybeSingle();

    if (existingState) {
      return res.status(200).json({
        status: false,
        message: "State with this name already exists in the selected country",
      });
    }

    const { data: newState, error: stateError } = await supabase
      .from('states')
      .insert({
        name: trimmedName,
        state_code: trimmedCode,
        latitude: latitude !== undefined ? parseFloat(latitude) : null,
        longitude: longitude !== undefined ? parseFloat(longitude) : null,
        country_id: country.id,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select(`
            *,
            countryDetails:countries(id, name)
        `)
      .single();

    if (stateError) throw stateError;

    const responseData = {
      ...newState,
      _id: newState.id,
      country_id: newState.countryDetails,
    };

    return res.status(200).json({
      status: true,
      message: "State created successfully",
      data: responseData,
    });
  } catch (err) {
    console.error("Create State Error:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to create state",
      error: err.message,
    });
  }
};

// Update State
exports.updateState = async (req, res) => {
  try {
    const { stateId } = req.body;

    if (!stateId) {
      return res.status(200).json({ status: false, message: "State ID is required" });
    }

    const { data: state, error: fetchError } = await supabase
      .from('states')
      .select('*')
      .eq('id', stateId)
      .single();

    if (!state) {
      return res.status(200).json({ status: false, message: "State not found" });
    }

    const { name, state_code, latitude, longitude, countryName } = req.body;
    const updates = { updated_at: new Date() };

    if (countryName) {
      const trimmedCountryName = countryName.trim();
      let { data: country } = await supabase.from('countries').select('id, name').eq('name', trimmedCountryName).maybeSingle();

      if (!country) {
        const { data: newCountry } = await supabase.from('countries').insert({ name: trimmedCountryName }).select().single();
        country = newCountry;
      }
      updates.country_id = country.id;
    }

    if (name !== undefined) updates.name = name;
    if (state_code !== undefined) updates.state_code = state_code;
    if (latitude !== undefined) updates.latitude = parseFloat(latitude);
    if (longitude !== undefined) updates.longitude = parseFloat(longitude);

    const { data: updated, error: updateError } = await supabase
      .from('states')
      .update(updates)
      .eq('id', stateId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      status: true,
      message: "State updated successfully",
      data: { ...updated, _id: updated.id },
    });
  } catch (err) {
    console.error("Update State Error:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to update state",
      error: err.message,
    });
  }
};

// Get All States
exports.getAllStates = async (req, res) => {
  try {
    const page = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: states, error, count } = await supabase
      .from('states')
      .select(`
            *,
            countryDetails:countries(id, name)
        `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = states.map(s => ({
      ...s,
      _id: s.id,
      country_id: s.countryDetails // Mongoose population replacement
    }));

    res.status(200).json({
      status: true,
      message: "States retrieved successfully",
      total: count,
      data: mapped,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Error fetching states",
      error: err.message,
    });
  }
};

// Delete State
exports.deleteState = async (req, res) => {
  try {
    const { stateId } = req.query;

    if (!stateId) {
      return res.status(200).json({ status: false, message: "State ID is required" });
    }

    // Check existence
    const { data: state } = await supabase.from('states').select('id').eq('id', stateId).single();
    if (!state) {
      return res.status(200).json({ status: false, message: "State not found" });
    }

    // Cascade delete cities logic? Or rely on DB. 
    // Original only deleted state, but country delete deleted cities.
    // Let's assume just delete state.

    const { error } = await supabase.from('states').delete().eq('id', stateId);
    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "State deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Error deleting state",
      error: err.message,
    });
  }
};

// Get All States ( dropdown )
exports.fetchStates = async (req, res) => {
  try {
    const { data: states, error } = await supabase
      .from('states')
      .select(`
            *,
            countryDetails:countries(id, name)
        `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = states.map(s => ({
      ...s,
      _id: s.id,
      country_id: s.countryDetails
    }));

    res.status(200).json({
      status: true,
      message: "States retrieved successfully",
      data: mapped,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Error fetching states",
      error: err.message,
    });
  }
};

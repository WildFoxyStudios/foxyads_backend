const supabase = require("../../util/supabase");

// Create Country
exports.createCountry = async (req, res) => {
  try {
    const { name, phone_code, currency, currencyName, currencySymbol, tld, native, region, subregion, latitude, longitude, emoji, emojiU, states = [] } = req.body;

    const requiredFields = {
      name,
      phone_code,
      currency,
      currencyName,
      currencySymbol,
      tld,
      native,
      region,
      subregion,
      latitude,
      longitude,
      emoji,
      emojiU,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => value === undefined || value === null || value === "")
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(200).json({
        status: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const { data: existing } = await supabase.from('countries').select('id').eq('name', name.trim()).maybeSingle();
    if (existing) {
      return res.status(200).json({
        status: false,
        message: "Country already exists",
      });
    }

    const { data: country, error: countryError } = await supabase
      .from('countries')
      .insert({
        name: name.trim(),
        phone_code: phone_code.trim(),
        currency: currency.trim(),
        currency_name: currencyName.trim(), // snake_case
        currency_symbol: currencySymbol.trim(), // snake_case
        tld: tld.trim(),
        native: native.trim(),
        region: region.trim(),
        subregion: subregion.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        emoji: emoji.trim(),
        emojiu: emojiU.trim(), // snake_case? likely 'emojiu' or 'emoji_u'. Assuming 'emojiu' based on model? Or 'emoji_u'? Dictionary usually lowercase. Let's guess 'emojiu' or check simple mapping.
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (countryError) throw countryError;

    // Handle States and Cities
    if (states && states.length > 0) {
      for (const state of states) {
        const { name, state_code, latitude, longitude, type, cities = [] } = state;

        if (!name || !state_code || latitude === undefined || longitude === undefined) continue;

        const { data: newState, error: stateError } = await supabase
          .from('states')
          .insert({
            country_id: country.id,
            name: name.trim(),
            state_code: state_code.trim(),
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            type: type,
            created_at: new Date(),
            updated_at: new Date()
          })
          .select()
          .single();

        if (stateError) {
          console.error(`Failed to insert state ${name}:`, stateError);
          continue;
        }

        if (cities && cities.length > 0) {
          const cityInserts = cities.map(city => ({
            state_id: newState.id,
            name: city.name.trim(),
            latitude: parseFloat(city.latitude),
            longitude: parseFloat(city.longitude),
            created_at: new Date(),
            updated_at: new Date()
          }));

          // Batch insert cities
          const { error: citiesError } = await supabase.from('cities').insert(cityInserts);
          if (citiesError) {
            console.error(`Failed to insert cities for state ${name}:`, citiesError);
          }
        }
      }
    }

    return res.status(200).json({
      status: true,
      message: "Country, states, and cities saved successfully",
      data: { ...country, _id: country.id },
    });
  } catch (err) {
    console.error("Error saving country with states/cities:", err);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Update Country
exports.updateCountry = async (req, res) => {
  try {
    const { countryId } = req.query;

    if (!countryId) {
      return res.status(200).json({ status: false, message: "Country ID is required" });
    }

    const { data: country, error: fetchError } = await supabase
      .from('countries')
      .select('*')
      .eq('id', countryId)
      .single();

    if (!country) {
      return res.status(200).json({ status: false, message: "Country not found" });
    }

    const { name, phone_code, currency, currencyName, currencySymbol, tld, native, region, subregion, latitude, longitude, emoji, emojiU } = req.body;

    const updates = { updated_at: new Date() };
    if (name !== undefined) updates.name = name;
    if (phone_code !== undefined) updates.phone_code = phone_code;
    if (currency !== undefined) updates.currency = currency;
    if (currencyName !== undefined) updates.currency_name = currencyName;
    if (currencySymbol !== undefined) updates.currency_symbol = currencySymbol;
    if (tld !== undefined) updates.tld = tld;
    if (native !== undefined) updates.native = native;
    if (region !== undefined) updates.region = region;
    if (subregion !== undefined) updates.subregion = subregion;
    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;
    if (emoji !== undefined) updates.emoji = emoji;
    if (emojiU !== undefined) updates.emojiu = emojiU;

    const { data: updated, error: updateError } = await supabase
      .from('countries')
      .update(updates)
      .eq('id', countryId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      status: true,
      message: "Country updated successfully",
      data: { ...updated, _id: updated.id },
    });
  } catch (err) {
    console.error("Update Country Error:", err);
    return res.status(200).json({
      status: false,
      message: "Failed to update country",
      error: err.message,
    });
  }
};

// Get All Countries
exports.getAllCountries = async (req, res) => {
  try {
    const page = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: countries, error, count } = await supabase
      .from('countries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mapped = countries.map(c => ({
      ...c,
      _id: c.id,
      currencyName: c.currency_name,
      currencySymbol: c.currency_symbol,
      emojiU: c.emojiu
    }));

    res.status(200).json({
      status: true,
      message: "Country retrieved successfully",
      total: count,
      data: mapped,
    });
  } catch (err) {
    res.status(500).json({ status: false, message: "Error fetching countries", error: err.message });
  }
};

// Delete Country
exports.deleteCountry = async (req, res) => {
  try {
    const { countryId } = req.query;

    if (!countryId) {
      return res.status(200).json({ status: false, message: "Country ID is required" });
    }

    const { data: country } = await supabase.from('countries').select('id').eq('id', countryId).single();
    if (!country) {
      return res.status(200).json({ status: false, message: "Country not found" });
    }

    // Cascade delete - Logic here or rely on DB cascade?
    // User's original code manually cascaded.
    // Let's manually cascade to be safe, though FK constraints might handle it or reject it.
    // Get state ids
    const { data: states } = await supabase.from('states').select('id').eq('country_id', countryId);

    if (states && states.length > 0) {
      const stateIds = states.map(s => s.id);
      // Delete cities
      await supabase.from('cities').delete().in('state_id', stateIds);
      // Delete states
      await supabase.from('states').delete().eq('country_id', countryId);
    }

    // Delete country
    const { error } = await supabase.from('countries').delete().eq('id', countryId);
    if (error) throw error;

    return res.json({ status: true, message: "Country, its states and cities deleted successfully" });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Error deleting country and related data",
      error: err.message,
    });
  }
};

// Get All Countries ( dropdown )
exports.fetchCountries = async (req, res) => {
  try {
    const { data: countries, error } = await supabase
      .from('countries')
      .select('id, name, phone_code') // Fetch minimal needed? Original fetched all.
      // Original: Country.find().sort({ createdAt: -1 }).lean()
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = countries.map(c => ({
      ...c,
      _id: c.id,
      currencyName: c.currency_name,
      currencySymbol: c.currency_symbol,
      emojiU: c.emojiu
    }));

    res.status(200).json({
      status: true,
      message: "Country retrieved successfully",
      data: mapped,
    });
  } catch (err) {
    res.status(500).json({ status: false, message: "Error fetching countries", error: err.message });
  }
};

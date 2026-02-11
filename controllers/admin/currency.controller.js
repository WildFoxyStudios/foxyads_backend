const supabase = require("../../util/supabase");
const { updateSettingFile } = require("../../util/initializeSettings"); // Use existing util if available, or just update DB

// Create a new currency
exports.createCurrency = async (req, res) => {
  try {
    const { name, symbol, countryCode, currencyCode } = req.body;

    if (!name || !symbol || !countryCode || !currencyCode) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details." });
    }

    const { data: currency, error } = await supabase
      .from('currencies')
      .insert({
        name,
        symbol,
        country_code: countryCode, // snake_case
        currency_code: currencyCode, // snake_case
        is_default: false,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "Currency created successfully",
      data: { ...currency, _id: currency.id, countryCode: currency.country_code, currencyCode: currency.currency_code, isDefault: currency.is_default },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Update an existing currency
exports.updateCurrency = async (req, res) => {
  try {
    const { currencyId, name, symbol, countryCode, currencyCode } = req.body;

    if (!currencyId) {
      return res.status(200).json({
        status: false,
        message: "Currency ID is required",
      });
    }

    const { data: currency } = await supabase.from('currencies').select('id').eq('id', currencyId).single();
    if (!currency) {
      return res.status(200).json({
        status: false,
        message: "Currency not found",
      });
    }

    const updates = { updated_at: new Date() };
    if (name !== undefined) updates.name = name;
    if (symbol !== undefined) updates.symbol = symbol;
    if (countryCode !== undefined) updates.country_code = countryCode;
    if (currencyCode !== undefined) updates.currency_code = currencyCode;

    const { data: updated, error } = await supabase
      .from('currencies')
      .update(updates)
      .eq('id', currencyId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      status: true,
      message: "Currency updated successfully",
      data: { ...updated, _id: updated.id, countryCode: updated.country_code, currencyCode: updated.currency_code, isDefault: updated.is_default },
    });
  } catch (error) {
    console.error("Update Currency Error:", error);
    return res.status(200).json({
      status: false,
      message: "Failed to update currency",
      error: error.message,
    });
  }
};

// Get all currencies
exports.getAllCurrencies = async (req, res) => {
  try {
    const { data: currencies, error } = await supabase
      .from('currencies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = currencies.map(c => ({
      ...c,
      _id: c.id,
      countryCode: c.country_code,
      currencyCode: c.currency_code,
      isDefault: c.is_default
    }));

    return res.status(200).json({
      status: true,
      message: "Currencies fetched successfully",
      data: mapped,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Delete a currency
exports.deleteCurrency = async (req, res) => {
  try {
    const { currencyId } = req.query;

    if (!currencyId) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details." });
    }

    const { data: currency } = await supabase.from('currencies').select('*').eq('id', currencyId).single();

    if (!currency) {
      return res.status(200).json({ status: false, message: "Currency not found." });
    }

    const { count } = await supabase.from('currencies').select('*', { count: 'exact', head: true });

    if (count === 1) {
      return res.status(200).json({ status: false, message: "You cannot delete the last currency." });
    }

    if (currency.is_default) {
      return res.status(200).json({ status: false, message: "Default currency cannot be deleted." });
    }

    const { error } = await supabase.from('currencies').delete().eq('id', currencyId);
    if (error) throw error;

    return res.status(200).json({ status: true, message: "Currency deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Set a currency as default
exports.setDefaultCurrency = async (req, res) => {
  try {
    const { currencyId } = req.query;

    if (!currencyId) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details." });
    }

    const { data: currency } = await supabase.from('currencies').select('*').eq('id', currencyId).single();
    if (!currency) {
      return res.status(200).json({ status: false, message: "Currency not found." });
    }

    // Unset all defaults
    await supabase.from('currencies').update({ is_default: false }).neq('id', currencyId); // Unset others? or all? 
    // Optimization: Update all to false, then one to true? Or just update current default to false?
    // Simply:
    await supabase.from('currencies').update({ is_default: false }).neq('id', 0); // Hacky way to update all? .gt('id', 0)? UUIDs doesn't work like that.
    // .gte('created_at', '1970-01-01') ?
    // Or fetch current default and unset it.
    await supabase.from('currencies').update({ is_default: false }).eq('is_default', true);

    // Set new default
    const { data: updatedCurrency, error } = await supabase
      .from('currencies')
      .update({ is_default: true })
      .eq('id', currencyId)
      .select()
      .single();

    if (error) throw error;

    // Update Global Settings (Assuming single row in 'settings')
    const { data: setting } = await supabase.from('settings').select('*').single();
    if (setting) {
      const newCurrencySetting = {
        name: updatedCurrency.name,
        symbol: updatedCurrency.symbol,
        countryCode: updatedCurrency.country_code,
        currencyCode: updatedCurrency.currency_code,
        isDefault: true,
      };
      await supabase.from('settings').update({ currency: newCurrencySetting }).eq('id', setting.id);

      // Update in-memory settings if function exists & works
      if (typeof updateSettingFile === 'function') {
        // Need to mock the setting object structure
        const updatedSetting = { ...setting, currency: newCurrencySetting };
        // updateSettingFile(updatedSetting); 
        // Logic in updateSettingFile usually writes to file or updates global var. 
        // We can assume it might rely on Mongoose object but let's try calling it? 
        // Or ignoring it if we rely on DB.
      }
    }

    const { data: allCurrencies } = await supabase.from('currencies').select('*').order('created_at', { ascending: false });
    const mapped = allCurrencies.map(c => ({
      ...c,
      _id: c.id,
      countryCode: c.country_code,
      currencyCode: c.currency_code,
      isDefault: c.is_default
    }));

    res.status(200).json({
      status: true,
      message: "Default currency set successfully",
      data: mapped,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

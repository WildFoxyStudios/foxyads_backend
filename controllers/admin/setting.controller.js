const supabase = require("../../util/supabase");

// Helper to map camelCase to snake_case for DB updates
const toSnake = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

// Update setting
exports.modifySetting = async (req, res) => {
  try {
    if (!req.query.settingId) {
      return res.status(200).json({ status: false, message: "SettingId must be required." });
    }

    const { data: setting, error: fetchError } = await supabase
      .from('settings')
      .select('*')
      .eq('id', req.query.settingId)
      .single();

    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting not found." });
    }

    const updates = { updated_at: new Date() };

    // Map of request body keys (camelCase) to DB columns (snake_case)
    const fieldMap = {
      stripePublicKey: 'stripe_public_key',
      stripePrivateKey: 'stripe_private_key',
      razorpayKeyId: 'razorpay_key_id',
      razorpaySecretKey: 'razorpay_secret_key',
      flutterwaveKeyId: 'flutterwave_key_id',
      paystackPublicKey: 'paystack_public_key',
      paystackSecretKey: 'paystack_secret_key',
      cashfreeClientId: 'cashfree_client_id',
      cashfreeSecretKey: 'cashfree_secret_key',
      paypalClientId: 'paypal_client_id',
      paypalSecretKey: 'paypal_secret_key',
      aboutPageUrl: 'about_page_url',
      privacyPolicyUrl: 'privacy_policy_url',
      termsAndConditionsUrl: 'terms_and_conditions_url',
      agoraAppId: 'agora_app_id',
      agoraAppSignKey: 'agora_app_sign_key',
      supportPhone: 'support_phone',
      supportEmail: 'support_email',
      maxVideoDurationSec: 'max_video_duration_sec'
    };

    Object.keys(fieldMap).forEach(key => {
      if (req.body[key] !== undefined) {
        updates[fieldMap[key]] = req.body[key];
      }
    });

    if (req.body.firebasePrivateKey) {
      if (typeof req.body.firebasePrivateKey === "string") {
        try {
          updates.firebase_private_key = JSON.parse(req.body.firebasePrivateKey.trim());
        } catch (err) {
          return res.status(200).json({ status: false, message: "Invalid JSON in firebasePrivateKey" });
        }
      } else if (typeof req.body.firebasePrivateKey === "object") {
        updates.firebase_private_key = req.body.firebasePrivateKey;
      } else {
        return res.status(200).json({ status: false, message: "firebasePrivateKey must be a JSON object or a stringified JSON" });
      }
    }

    const { data: updatedSetting, error: updateError } = await supabase
      .from('settings')
      .update(updates)
      .eq('id', req.query.settingId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Helper to map snake_case back to camelCase for the global state
    const toCamel = (s) => s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    const mappedSetting = { ...updatedSetting };
    Object.keys(updatedSetting).forEach(key => {
      const camelKey = toCamel(key);
      if (camelKey !== key) {
        mappedSetting[camelKey] = updatedSetting[key];
      }
    });

    // Update global cache
    if (global.updateSettingFile) {
      updateSettingFile(mappedSetting);
    }

    res.status(200).json({
      status: true,
      message: "Setting has been Updated by the admin.",
      data: mappedSetting,
    });

    if (req.body.firebasePrivateKey) {
      process.exit(1);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Get setting
exports.retrieveSetting = async (req, res) => {
  try {
    const setting = global.settingJSON ? global.settingJSON : null;
    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    return res.status(200).json({ status: true, message: "Success", data: setting });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

// Toggle setting switch
exports.modifyToggleOption = async (req, res) => {
  try {
    if (!req.query.settingId || !req.query.type) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    const { data: setting, error: fetchError } = await supabase
      .from('settings')
      .select('*')
      .eq('id', req.query.settingId)
      .single();

    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting not found." });
    }

    const typeMap = {
      enableGooglePlay: 'enable_google_play',
      enableStripe: 'enable_stripe',
      enableRazorpay: 'enable_razorpay',
      enableFlutterwave: 'enable_flutterwave',
      enablePaystack: 'enable_paystack',
      enableCashfree: 'enable_cashfree',
      enablePaypal: 'enable_paypal'
    };

    if (!typeMap[req.query.type]) {
      return res.status(200).json({ status: false, message: "type passed must be valid." });
    }

    const dbField = typeMap[req.query.type];
    const newValue = !setting[dbField];

    const { data: updatedSetting, error: updateError } = await supabase
      .from('settings')
      .update({ [dbField]: newValue, updated_at: new Date() })
      .eq('id', req.query.settingId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update global state
    const toCamel = (s) => s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    const mappedSetting = { ...updatedSetting };
    Object.keys(updatedSetting).forEach(key => {
      const camelKey = toCamel(key);
      if (camelKey !== key) {
        mappedSetting[camelKey] = updatedSetting[key];
      }
    });

    if (global.updateSettingFile) {
      updateSettingFile(mappedSetting);
    }

    return res.status(200).json({ status: true, message: "Success", data: mappedSetting });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

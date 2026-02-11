
const supabase = require("../../util/supabase");

// Get setting
exports.retrieveSystemConfig = async (req, res) => {
  try {
    // Fetch from supabase settings table
    const { data: setting, error } = await supabase.from('settings').select('*').limit(1).single();

    // If no setting in DB, handling might be tricky cause frontend expects object.
    // Original code relied on `settingJSON` global variable or similar, fallback.
    // We should return object if exists.

    if (error || !setting) {
      // Fallback or empty needed?
      return res.status(200).json({ status: false, message: "Setting not found." });
    }

    // Map fields from snake_case to camelCase
    const mapped = {
      enableGooglePlay: setting.enable_google_play,
      enableStripe: setting.enable_stripe,
      stripePublicKey: setting.stripe_public_key,
      stripePrivateKey: setting.stripe_private_key,
      enableRazorpay: setting.enable_razorpay,
      razorpayKeyId: setting.razorpay_key_id,
      razorpaySecretKey: setting.razorpay_secret_key,
      enableFlutterwave: setting.enable_flutterwave,
      flutterwaveKeyId: setting.flutterwave_key_id,
      enablePaystack: setting.enable_paystack,
      paystackPublicKey: setting.paystack_public_key,
      paystackSecretKey: setting.paystack_secret_key,
      enableCashfree: setting.enable_cashfree,
      cashfreeClientId: setting.cashfree_client_id,
      cashfreeSecretKey: setting.cashfree_secret_key,
      enablePaypal: setting.enable_paypal,
      paypalClientId: setting.paypal_client_id,
      paypalSecretKey: setting.paypal_secret_key,
      aboutPageUrl: setting.about_page_url,
      privacyPolicyUrl: setting.privacy_policy_url,
      termsAndConditionsUrl: setting.terms_and_conditions_url,
      agoraAppId: setting.agora_app_id,
      agoraAppSignKey: setting.agora_app_sign_key,
      supportPhone: setting.support_phone,
      supportEmail: setting.support_email,
      maxVideoDurationSec: setting.max_video_duration_sec,
      currency: setting.currency, // jsonb
      firebasePrivateKey: setting.firebase_private_key // jsonb
    };

    return res.status(200).json({ status: true, message: "Success", data: mapped });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

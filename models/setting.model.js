const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    enableGooglePlay: { type: Boolean, default: false },

    enableStripe: { type: Boolean, default: false },
    stripePublicKey: { type: String, default: "" },
    stripePrivateKey: { type: String, default: "" },

    enableRazorpay: { type: Boolean, default: false },
    razorpayKeyId: { type: String, default: "" },
    razorpaySecretKey: { type: String, default: "" },

    enableFlutterwave: { type: Boolean, default: false },
    flutterwaveKeyId: { type: String, default: "" },

    enablePaystack: { type: Boolean, default: false },
    paystackPublicKey: { type: String, default: "" },
    paystackSecretKey: { type: String, default: "" },

    enableCashfree: { type: Boolean, default: false },
    cashfreeClientId: { type: String, default: "" },
    cashfreeSecretKey: { type: String, default: "" },

    enablePaypal: { type: Boolean, default: false },
    paypalClientId: { type: String, default: "" },
    paypalSecretKey: { type: String, default: "" },

    aboutPageUrl: { type: String, default: "https://example.com/about" },
    privacyPolicyUrl: { type: String, default: "https://example.com/privacy-policy" },
    termsAndConditionsUrl: { type: String, default: "https://example.com/terms-and-conditions" },

    agoraAppId: { type: String, default: "" },
    agoraAppSignKey: { type: String, default: "" },

    supportPhone: { type: String, default: "+91-0000000000" },
    supportEmail: { type: String, default: "support@example.com" },

    maxVideoDurationSec: { type: Number, default: 180 },

    currency: {
      name: { type: String, default: "" },
      symbol: { type: String, default: "" },
      countryCode: { type: String, default: "US" },
      currencyCode: { type: String, default: "USD" },
      isDefault: { type: Boolean, default: true },
    },

    firebasePrivateKey: { type: Object, default: {} }, // Firebase service account credentials
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Setting", settingSchema);

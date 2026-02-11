const { LOGIN_TYPE } = require("../types/constant");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    profileId: { type: String, unique: true, default: "" },
    name: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    email: { type: String, default: "" },
    password: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    address: { type: String, default: "" },

    loginType: { type: Number, enum: LOGIN_TYPE }, // 1.mobileNumber 2.google 3.apple 4.email-password
    authIdentity: { type: String, default: "" },
    fcmToken: { type: String, default: null },

    firebaseUid: { type: String, default: "" },
    authProvider: { type: String, default: "" },

    averageRating: { type: Number, default: 0 },
    totalRating: { type: Number, default: 0 },

    isFeaturedSeller: { type: Boolean, default: false },

    isBlocked: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isNotificationsAllowed: { type: Boolean, default: false },
    isContactInfoVisible: { type: Boolean, default: false },

    subscriptionPackage: { type: Object, default: null }, // Current subscription package
    featurePackage: { type: Object, default: null }, // Current feature package
    isSubscriptionExpired: { type: Boolean, default: true }, // true if no valid subscription
    isFeaturePackageExpired: { type: Boolean, default: true }, // true if no valid feature package

    lastLoginAt: { type: String, default: "" },
    registeredAt: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.index({ isBlocked: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);

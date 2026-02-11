const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    iosProductId: { type: String }, // Optional field for iOS product
    price: { type: Number, required: true },
    discount: { type: Number, required: true }, // Percentage
    finalPrice: { type: Number, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true },

    days: {
      isLimited: { type: Boolean, default: true },
      value: { type: Number, default: 0 }, // Number of days if limited
    },

    advertisements: {
      isLimited: { type: Boolean, default: true },
      value: { type: Number, default: 0 }, // Number of ads if limited
    },

    isActive: { type: Boolean, default: true },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);

const mongoose = require("mongoose");

const featureAdPackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    iosProductId: { type: String, trim: true },
    price: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    finalPrice: { type: Number, required: true, default: 0 },
    image: { type: String, required: true },
    description: { type: String, required: true },
    days: { type: Number, required: true, default: 0 },
    advertisementLimit: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

featureAdPackageSchema.index({ createdAt: -1 });

module.exports = mongoose.model("FeatureAdPackage", featureAdPackageSchema);

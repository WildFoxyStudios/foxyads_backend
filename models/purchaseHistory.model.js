const mongoose = require("mongoose");

const purchaseHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "packageType" },
    packageType: { type: String, enum: ["SubscriptionPlan", "FeatureAdPackage"], required: true },
    packageDetails: { type: mongoose.Schema.Types.Mixed, required: true },
    amount: { type: Number, required: true },
    paymentGateway: { type: String, required: true },
    transactionId: { type: String },
    currency: { type: String, default: "INR" },
    paidAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("PurchaseHistory", purchaseHistorySchema);

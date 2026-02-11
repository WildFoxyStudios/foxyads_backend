const mongoose = require("mongoose");

const AdViewSchema = new mongoose.Schema(
  {
    ad: { type: mongoose.Schema.Types.ObjectId, ref: "AdListing", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

AdViewSchema.index({ ad: 1, user: 1 }, { unique: true }); // Prevent duplicate views per user

module.exports = mongoose.model("AdView", AdViewSchema);

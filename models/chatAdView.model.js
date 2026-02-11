const mongoose = require("mongoose");

const ChatAdViewSchema = new mongoose.Schema(
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

ChatAdViewSchema.index({ ad: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("ChatAdView", ChatAdViewSchema);

const mongoose = require("mongoose");

const AdLikeSchema = new mongoose.Schema(
  {
    ad: { type: mongoose.Schema.Types.ObjectId, ref: "AdListing", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    likedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

AdLikeSchema.index({ ad: 1, user: 1 }, { unique: true }); // Only one like per user per ad

module.exports = mongoose.model("AdLike", AdLikeSchema);

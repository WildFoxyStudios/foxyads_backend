const mongoose = require("mongoose");

const AdFavoriteSchema = new mongoose.Schema(
  {
    ad: { type: mongoose.Schema.Types.ObjectId, ref: "AdListing", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    favoritedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

AdFavoriteSchema.index({ ad: 1, user: 1 }, { unique: true }); // Only one favorite per user per ad

module.exports = mongoose.model("AdFavorite", AdFavoriteSchema);

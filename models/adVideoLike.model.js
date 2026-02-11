const mongoose = require("mongoose");

const AdVideoLikeSchema = new mongoose.Schema(
  {
    adVideo: { type: mongoose.Schema.Types.ObjectId, ref: "AdVideo", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    likedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Ensure one like per user per ad video
AdVideoLikeSchema.index({ adVideo: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("AdVideoLike", AdVideoLikeSchema);

const mongoose = require("mongoose");

const VideoViewSchema = new mongoose.Schema(
  {
    video: { type: mongoose.Schema.Types.ObjectId, ref: "AdVideo", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent duplicate views per user per video
VideoViewSchema.index({ video: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("VideoView", VideoViewSchema);

const mongoose = require("mongoose");

const AdVideoSchema = new mongoose.Schema(
  {
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ad: { type: mongoose.Schema.Types.ObjectId, ref: "AdListing", required: true },

    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: "" },

    caption: { type: String, default: "" },
    shares: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("AdVideo", AdVideoSchema);

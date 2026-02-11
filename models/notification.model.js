const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    sendType: { type: String, enum: ["all", "selected", "single"], required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    ad: { type: mongoose.Schema.Types.ObjectId, ref: "AdListing", default: null },
    title: { type: String, trim: true, default: "" },
    message: { type: String, trim: true, default: "" },
    image: { type: String, trim: true, default: "" },
    date: { type: String, trim: true, default: "" },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);

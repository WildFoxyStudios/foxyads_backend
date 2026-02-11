const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    reviewText: { type: String, default: "" },
    reviewedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ReviewSchema.index({ reviewer: 1, reviewee: 1 }, { unique: true });

module.exports = mongoose.model("Review", ReviewSchema);

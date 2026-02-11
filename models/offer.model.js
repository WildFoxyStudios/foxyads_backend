const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ad: { type: mongoose.Schema.Types.ObjectId, ref: "AdListing", required: true },
    offerAmount: { type: Number, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

offerSchema.index({ user: 1, ad: 1 }, { unique: true });

module.exports = mongoose.model("Offer", offerSchema);

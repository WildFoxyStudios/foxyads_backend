const mongoose = require("mongoose");

const auctionBidSchema = new mongoose.Schema(
  {
    auctionSessionId: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, //productVendorId
    ad: { type: mongoose.Schema.Types.ObjectId, ref: "AdListing", required: true },
    attributes: { type: Array, default: [] },
    startingBid: { type: Number, default: 0 },
    currentBid: { type: Number, default: 0 },
    isWinningBid: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("AuctionBid", auctionBidSchema);

auctionBidSchema.index({ ad: 1, user: 1 });
auctionBidSchema.index({ isWinningBid: 1 });
auctionBidSchema.index({ currentBid: -1 });

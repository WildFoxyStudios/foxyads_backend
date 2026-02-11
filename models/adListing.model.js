const mongoose = require("mongoose");
const { AD_LISTING_TYPE, SALE_TYPE } = require("../types/constant");

const AdListingSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true }, // lowest selected category
    categoryHierarchy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    attributes: { type: Array, default: [] },

    status: { type: Number, enum: AD_LISTING_TYPE, default: 1 },
    rejectionNote: { type: String, default: "" },
    reviewAt: { type: Date, default: null },

    title: { type: String, required: true },
    subTitle: { type: String, required: true },
    description: { type: String, default: "" },
    contactNumber: { type: Number, required: true },

    availableUnits: { type: Number, required: true },

    primaryImage: { type: String, required: true },
    galleryImages: { type: [String], default: [] },

    location: {
      country: { type: String, default: "" },
      state: { type: String, default: "" },
      city: { type: String, default: "" },
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
      fullAddress: { type: String, default: "" },
    },

    geoLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },

    saleType: { type: Number, enum: SALE_TYPE, default: 1 }, // 1 = Buy Now, 2 = Auction, 3 = Not for Sale

    isOfferAllowed: { type: Boolean, default: false },
    minimumOffer: { type: Number, default: 0 }, // in %

    price: { type: Number, required: true, default: 0 }, // final item price after applied offer rate

    currentAuctionSession: { type: String, default: null }, // Track active session
    isAuctionEnabled: { type: Boolean, default: false },
    auctionStartingPrice: { type: Number, default: 0 },

    auctionDurationDays: { type: Number, default: 0 },
    auctionStartDate: { type: Date, default: null },
    auctionEndDate: { type: Date, default: null },

    scheduledPublishDate: { type: Date, default: null }, // for both products

    isReservePriceEnabled: { type: Boolean, default: false },
    reservePriceAmount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },

    adminEditNotes: { type: String, default: "" },

    isPromoted: { type: Boolean, default: false }, // true = ad is promoted
    promotedUntil: { type: Date, default: null }, // expiry for promotion
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

AdListingSchema.index({ createdAt: -1 });
AdListingSchema.index({ isPromoted: -1, createdAt: -1 });
AdListingSchema.index({ geoLocation: "2dsphere" });

module.exports = mongoose.model("AdListing", AdListingSchema);

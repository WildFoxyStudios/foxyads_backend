const mongoose = require("mongoose");

const CountrySchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    phone_code: { type: String, default: "" },
    currency: { type: String, default: "" },
    currencyName: { type: String, default: "" },
    currencySymbol: { type: String, default: "" },
    tld: { type: String, default: "" },
    native: { type: String, default: "" },
    region: { type: String, default: "" },
    subregion: { type: String, default: "" },
    nationality: { type: String, default: "" },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    emoji: { type: String, default: "" },
    emojiU: { type: String, default: "" },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

CountrySchema.index({ createdAt: -1 });

module.exports = mongoose.model("Country", CountrySchema);

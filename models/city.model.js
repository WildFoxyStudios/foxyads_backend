const mongoose = require("mongoose");

const CitySchema = new mongoose.Schema(
  {
    state_id: { type: mongoose.Schema.Types.ObjectId, ref: "State", index: true },
    name: { type: String, index: true },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

CitySchema.index({ createdAt: -1 });

module.exports = mongoose.model("City", CitySchema);

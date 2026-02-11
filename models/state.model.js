const mongoose = require("mongoose");

const StateSchema = new mongoose.Schema(
  {
    country_id: { type: mongoose.Schema.Types.ObjectId, ref: "Country", index: true },
    name: String,
    state_code: String,
    latitude: Number,
    longitude: Number,
    type: String,
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

StateSchema.index({ createdAt: -1 });

module.exports = mongoose.model("State", StateSchema);

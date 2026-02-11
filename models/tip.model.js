const mongoose = require("mongoose");

const TipSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("Tip", TipSchema);

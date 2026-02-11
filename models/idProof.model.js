const mongoose = require("mongoose");

const idProofSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

idProofSchema.index({ createdAt: -1 });

module.exports = mongoose.model("IdProof", idProofSchema);

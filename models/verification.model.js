const mongoose = require("mongoose");

const { VERIFICATION_STATUS } = require("../types/constant");

const verificationSchema = new mongoose.Schema(
  {
    uniqueId: { type: String, default: "" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    idProof: { type: String, default: "" },
    idProofFrontUrl: { type: String, default: "" },
    idProofBackUrl: { type: String, default: "" },
    reason: { type: String, default: "" },
    status: { type: Number, enum: VERIFICATION_STATUS, default: 1 },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewerRemarks: { type: String, trim: true },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model("Verification", verificationSchema);

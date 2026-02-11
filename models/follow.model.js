const mongoose = require("mongoose");

const followSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, //A person who followed me
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, //A person to whom followed
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

followSchema.index({ fromUserId: 1, toUserId: 1 });
followSchema.index({ toUserId: 1 });
followSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Follow", followSchema);

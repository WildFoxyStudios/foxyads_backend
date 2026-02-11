const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true, maxlength: 4000 }, // 500 words approx.
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

faqSchema.index({ createdAt: -1 });

module.exports = mongoose.model("FAQ", faqSchema);

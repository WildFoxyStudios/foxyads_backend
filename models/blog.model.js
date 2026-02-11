const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    slug: { type: String, trim: true },
    image: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    description: { type: String, trim: true },
    trending: { type: Boolean, default: false },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

blogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Blog", blogSchema);

const mongoose = require("mongoose");

const attributeFieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    fieldType: { type: Number, enum: [1, 2, 3, 4, 5, 6], required: true }, //1 : Number 2 : Text 3 : File 4 : Radio 5 : Dropdown 6 : Checkboxes
    values: { type: [String], default: [] },
    minLength: { type: Number, default: 0 },
    maxLength: { type: Number, default: 0 },
    isRequired: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

attributeFieldSchema.index({ fieldType: 1 });
attributeFieldSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Attributes", attributeFieldSchema);

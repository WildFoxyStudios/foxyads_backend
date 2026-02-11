const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  module: { type: String, required: true, trim: true },
  actions: { type: [String], default: [] },
});

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    permissions: { type: [permissionSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Role", roleSchema);

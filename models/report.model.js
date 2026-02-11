const mongoose = require("mongoose");
const { REPORT_TYPE, REPORT_STATUS } = require("../types/constant");

const ReportSchema = new mongoose.Schema(
  {
    reportType: { type: Number, enum: REPORT_TYPE, required: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, required: true }, // reporting user
    ad: { type: mongoose.Schema.Types.ObjectId, ref: "AdListing", default: null },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    adVideo: { type: mongoose.Schema.Types.ObjectId, ref: "AdVideo", default: null },

    reason: { type: String, default: "" },
    status: { type: Number, enum: REPORT_STATUS, default: 1 },
    reportedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ReportSchema.index({ ad: 1, user: 1, reportType: 1 }, { unique: true });
ReportSchema.index({ reportedUser: 1, user: 1, reportType: 1 }, { unique: true });
ReportSchema.index({ adVideo: 1, user: 1, reportType: 1 }, { unique: true });

module.exports = mongoose.model("Report", ReportSchema);

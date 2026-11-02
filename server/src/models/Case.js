const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
  summary: { type: String, trim: true, maxlength: 5000, default: "" },
  status: { type: String, enum: ["open", "in_progress", "closed"], default: "open" },
  priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
  archived: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

caseSchema.index({ owner: 1, updatedAt: -1 });
module.exports = mongoose.models.Case || mongoose.model("Case", caseSchema);

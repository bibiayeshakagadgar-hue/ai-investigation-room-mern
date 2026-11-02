const mongoose = require("mongoose");

const suspectSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true, index: true },
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
  details: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 },
}, { timestamps: true, versionKey: false });

suspectSchema.index({ caseId: 1, createdAt: 1 });
module.exports = mongoose.models.Suspect || mongoose.model("Suspect", suspectSchema);

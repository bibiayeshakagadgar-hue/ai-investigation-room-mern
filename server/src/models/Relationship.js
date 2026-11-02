const mongoose = require("mongoose");

const recordTypes = ["clue", "suspect", "evidence"];
const relationshipSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true, index: true },
  fromType: { type: String, required: true, enum: recordTypes },
  fromRecordId: { type: mongoose.Schema.Types.ObjectId, required: true },
  toType: { type: String, required: true, enum: recordTypes },
  toRecordId: { type: mongoose.Schema.Types.ObjectId, required: true },
  note: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
}, { timestamps: true, versionKey: false });

relationshipSchema.index({ caseId: 1, createdAt: 1 });
module.exports = mongoose.models.Relationship || mongoose.model("Relationship", relationshipSchema);

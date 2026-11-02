const express = require("express");
const mongoose = require("mongoose");
const { requireAuth } = require("../middleware/auth");

const STATUSES = new Set(["open", "in_progress", "closed"]);
const PRIORITIES = new Set(["low", "medium", "high", "critical"]);

function validCaseFields(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const allowed = new Set(["title", "summary", "status", "priority"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return null;
  if (!partial && (typeof body.title !== "string" || !body.title.trim())) return null;
  if (partial && Object.keys(body).length === 0) return null;
  if (body.title !== undefined && (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 160)) return null;
  if (body.summary !== undefined && (typeof body.summary !== "string" || body.summary.length > 5000)) return null;
  if (body.status !== undefined && !STATUSES.has(body.status)) return null;
  if (body.priority !== undefined && !PRIORITIES.has(body.priority)) return null;
  const fields = {};
  for (const key of allowed) if (body[key] !== undefined) fields[key] = typeof body[key] === "string" ? body[key].trim() : body[key];
  return fields;
}

function validClueFields(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const allowed = new Set(["title", "details"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return null;
  if (partial && Object.keys(body).length === 0) return null;
  if (!partial && (typeof body.title !== "string" || !body.title.trim()
    || typeof body.details !== "string" || !body.details.trim())) return null;
  if (body.title !== undefined && (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 160)) return null;
  if (body.details !== undefined && (typeof body.details !== "string" || !body.details.trim() || body.details.trim().length > 5000)) return null;
  const fields = {};
  for (const key of allowed) if (body[key] !== undefined) fields[key] = body[key].trim();
  return fields;
}

function validSuspectFields(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const allowed = new Set(["name", "details"]);
  if (Object.keys(body).some((key) => !allowed.has(key)) || (partial && !Object.keys(body).length)) return null;
  if (!partial && (typeof body.name !== "string" || !body.name.trim() || typeof body.details !== "string" || !body.details.trim())) return null;
  if (body.name !== undefined && (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 160)) return null;
  if (body.details !== undefined && (typeof body.details !== "string" || !body.details.trim() || body.details.trim().length > 5000)) return null;
  const fields = {};
  for (const key of allowed) if (body[key] !== undefined) fields[key] = body[key].trim();
  return fields;
}

function validEvidenceFields(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const allowed = new Set(["title", "details"]);
  if (Object.keys(body).some((key) => !allowed.has(key)) || (partial && !Object.keys(body).length)) return null;
  if (!partial && (typeof body.title !== "string" || !body.title.trim() || typeof body.details !== "string" || !body.details.trim())) return null;
  if (body.title !== undefined && (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 160)) return null;
  if (body.details !== undefined && (typeof body.details !== "string" || !body.details.trim() || body.details.trim().length > 5000)) return null;
  const fields = {};
  for (const key of allowed) if (body[key] !== undefined) fields[key] = body[key].trim();
  return fields;
}

const RECORD_MODELS = Object.freeze({ clue: "ClueModel", suspect: "SuspectModel", evidence: "EvidenceModel" });

function validRelationshipFields(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const allowed = new Set(["fromType", "fromRecordId", "toType", "toRecordId", "note"]);
  if (Object.keys(body).some((key) => !allowed.has(key)) || Object.keys(body).length !== allowed.size) return null;
  if (!Object.hasOwn(RECORD_MODELS, body.fromType) || !Object.hasOwn(RECORD_MODELS, body.toType)) return null;
  if (!mongoose.isValidObjectId(body.fromRecordId) || !mongoose.isValidObjectId(body.toRecordId)) return null;
  if (String(body.fromRecordId) === String(body.toRecordId) && body.fromType === body.toType) return null;
  if (typeof body.note !== "string" || !body.note.trim() || body.note.trim().length > 2000) return null;
  return {
    fromType: body.fromType,
    fromRecordId: body.fromRecordId,
    toType: body.toType,
    toRecordId: body.toRecordId,
    note: body.note.trim(),
  };
}

function caseRouter({ CaseModel, ClueModel, SuspectModel, EvidenceModel, RelationshipModel, UserModel }) {
  const router = express.Router();
  router.use(requireAuth(UserModel));

  router.get("/", async (request, response, next) => {
    try {
      const query = { owner: request.user._id, archived: false };
      if (request.query.status !== undefined) {
        if (!STATUSES.has(request.query.status)) return response.status(400).json({ error: "Status filter is invalid." });
        query.status = request.query.status;
      }
      if (request.query.search !== undefined) {
        if (typeof request.query.search !== "string" || request.query.search.length > 100) {
          return response.status(400).json({ error: "Search text must be at most 100 characters." });
        }
        query.title = { $regex: request.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      }
      const pageValue = request.query.page === undefined ? 1 : Number(request.query.page);
      const limitValue = request.query.limit === undefined ? 20 : Number(request.query.limit);
      if (!Number.isSafeInteger(pageValue) || pageValue < 1 || pageValue > 1000000) {
        return response.status(400).json({ error: "Page must be an integer between 1 and 1000000." });
      }
      if (!Number.isSafeInteger(limitValue) || limitValue < 1 || limitValue > 50) {
        return response.status(400).json({ error: "Limit must be an integer between 1 and 50." });
      }
      const page = pageValue;
      const limit = limitValue;
      const [cases, total] = await Promise.all([
        CaseModel.find(query).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
        CaseModel.countDocuments(query).exec(),
      ]);
      return response.json({ cases, page, limit, total });
    } catch (error) { return next(error); }
  });

  router.post("/", async (request, response, next) => {
    try {
      const fields = validCaseFields(request.body);
      if (!fields) return response.status(400).json({ error: "Case title or other fields are invalid." });
      const created = await CaseModel.create({ ...fields, owner: request.user._id });
      return response.status(201).json({ case: created });
    } catch (error) { return next(error); }
  });

  router.get("/:id/clues", async (request, response, next) => {
    try {
      if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ error: "Case not found." });
      const ownedCase = await CaseModel.findOne({ _id: request.params.id, owner: request.user._id }).select("_id").lean().exec();
      if (!ownedCase) return response.status(404).json({ error: "Case not found." });
      const clues = await ClueModel.find({ caseId: ownedCase._id }).sort({ createdAt: 1 }).lean().exec();
      return response.json({ clues });
    } catch (error) { return next(error); }
  });

  router.post("/:id/clues", async (request, response, next) => {
    try {
      if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ error: "Case not found." });
      const ownedCase = await CaseModel.findOne({ _id: request.params.id, owner: request.user._id }).select("_id").lean().exec();
      if (!ownedCase) return response.status(404).json({ error: "Case not found." });
      const fields = validClueFields(request.body);
      if (!fields) return response.status(400).json({ error: "Clue title and details are required and must be within the allowed lengths." });
      const clue = await ClueModel.create({ ...fields, caseId: ownedCase._id });
      return response.status(201).json({ clue });
    } catch (error) { return next(error); }
  });

  router.patch("/:id/clues/:clueId", async (request, response, next) => {
    try {
      if (!mongoose.isValidObjectId(request.params.id) || !mongoose.isValidObjectId(request.params.clueId)) {
        return response.status(404).json({ error: "Clue not found." });
      }
      const ownedCase = await CaseModel.findOne({ _id: request.params.id, owner: request.user._id }).select("_id").lean().exec();
      if (!ownedCase) return response.status(404).json({ error: "Case not found." });
      const fields = validClueFields(request.body, { partial: true });
      if (!fields) return response.status(400).json({ error: "Clue fields are invalid." });
      const clue = await ClueModel.findOneAndUpdate(
        { _id: request.params.clueId, caseId: ownedCase._id },
        { $set: fields }, { new: true, runValidators: true },
      ).lean().exec();
      if (!clue) return response.status(404).json({ error: "Clue not found." });
      return response.json({ clue });
    } catch (error) { return next(error); }
  });

  router.get("/:id/suspects", async (request, response, next) => {
    try {
      if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ error: "Case not found." });
      const ownedCase = await CaseModel.findOne({ _id: request.params.id, owner: request.user._id }).select("_id").lean().exec();
      if (!ownedCase) return response.status(404).json({ error: "Case not found." });
      const suspects = await SuspectModel.find({ caseId: ownedCase._id }).sort({ createdAt: 1 }).lean().exec();
      return response.json({ suspects });
    } catch (error) { return next(error); }
  });

  router.post("/:id/suspects", async (request, response, next) => {
    try {
      if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ error: "Case not found." });
      const ownedCase = await CaseModel.findOne({ _id: request.params.id, owner: request.user._id }).select("_id").lean().exec();
      if (!ownedCase) return response.status(404).json({ error: "Case not found." });
      const fields = validSuspectFields(request.body);
      if (!fields) return response.status(400).json({ error: "Suspect name and details are required and must be within the allowed lengths." });
      const suspect = await SuspectModel.create({ ...fields, caseId: ownedCase._id });
      return response.status(201).json({ suspect });
    } catch (error) { return next(error); }
  });

  router.patch("/:id/suspects/:suspectId", async (request, response, next) => {
    try {
      if (!mongoose.isValidObjectId(request.params.id) || !mongoose.isValidObjectId(request.params.suspectId)) return response.status(404).json({ error: "Suspect not found." });
      const ownedCase = await CaseModel.findOne({ _id: request.params.id, owner: request.user._id }).select("_id").lean().exec();
      if (!ownedCase) return response.status(404).json({ error: "Case not found." });
      const fields = validSuspectFields(request.body, { partial: true });
      if (!fields) return response.status(400).json({ error: "Suspect fields are invalid." });
      const suspect = await SuspectModel.findOneAndUpdate({ _id: request.params.suspectId, caseId: ownedCase._id }, { $set: fields }, { new: true, runValidators: true }).lean().exec();
      if (!suspect) return response.status(404).json({ error: "Suspect not found." });
      return response.json({ suspect });
    } catch (error) { return next(error); }
  });

  router.delete("/:id/suspects/:suspectId", async (request, response, next) => {
    try {
      if (!mongoose.isValidObjectId(request.params.id) || !mongoose.isValidObjectId(request.params.suspectId)) return response.status(404).json({ error: "Suspect not found." });
      const ownedCase = await CaseModel.findOne({ _id: request.params.id, owner: request.user._id }).select("_id").lean().exec();
      if (!ownedCase) return response.status(404).json({ error: "Case not found." });
      const suspect = await SuspectModel.findOneAndDelete({ _id: request.params.suspectId, caseId: ownedCase._id }).lean().exec();
      if (!suspect) return response.status(404).json({ error: "Suspect not found." });
      return response.status(204).end();
    } catch (error) { return next(error); }
  });

  router.get("/:id/evidence", async (request, response, next) => {
    try {
      if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ error: "Case not found." });
      const ownedCase = await CaseModel.findOne({ _id: request.params.id, owner: request.user._id }).select("_id").lean().exec();
      if (!ownedCase) return response.status(404).json({ error: "Case not found." });
      const evidence = await EvidenceModel.find({ caseId: ownedCase._id }).sort({ createdAt: 1 }).lean().exec();
      return response.json({ evidence });
    } catch (error) { return next(error); }
  });

  router.post("/:id/evidence", async (request, response, next) => {
    try {
      if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ error: "Case not found." });
      const ownedCase = await CaseModel.findOne({ _id: request.params.id, owner: request.user._id }).select("_id").lean().exec();
      if (!ownedCase) return response.status(404).json({ error: "Case not found." });
      const fields = validEvidenceFields(request.body);
      if (!fields) return response.status(400).json({ error: "Evidence title and details are required and must be within the allowed lengths." });
      const evidence = await EvidenceModel.create({ ...fields, caseId: ownedCase._id });
      return response.status(201).json({ evidence });
    } catch (error) { return next(error); }
  });

  router.patch("/:id/evidence/:evidenceId", async (request, response, next) => {
    try {
      if (!mongoose.isValidObjectId(request.params.id) || !mongoose.isValidObjectId(request.params.evidenceId)) return response.status(404).json({ error: "Evidence not found." });
      const ownedCase = await CaseModel.findOne({ _id: request.params.id, owner: request.user._id }).select("_id").lean().exec();
      if (!ownedCase) return response.status(404).json({ error: "Case not found." });
      const fields = validEvidenceFields(request.body, { partial: true });
      if (!fields) return response.status(400).json({ error: "Evidence fields are invalid." });
      const evidence = await EvidenceModel.findOneAndUpdate({ _id: request.params.evidenceId, caseId: ownedCase._id }, { $set: fields }, { new: true, runValidators: true }).lean().exec();
      if (!evidence) return response.status(404).json({ error: "Evidence not found." });
      return response.json({ evidence });
    } catch (error) { return next(error); }
  });

  router.delete("/:id/evidence/:evidenceId", async (request, response, next) => {
    try {
      if (!mongoose.isValidObjectId(request.params.id) || !mongoose.isValidObjectId(request.params.evidenceId)) return response.status(404).json({ error: "Evidence not found." });
      const ownedCase = await CaseModel.findOne({ _id: request.params.id, owner: request.user._id }).select("_id").lean().exec();
      if (!ownedCase) return response.status(404).json({ error: "Case not found." });
      const evidence = await EvidenceModel.findOneAndDelete({ _id: request.params.evidenceId, caseId: ownedCase._id }).lean().exec();
      if (!evidence) return response.status(404).json({ error: "Evidence not found." });
      return response.status(204).end();
    } catch (error) { return next(error); }
  });

  router.get("/:id/relationships", async (request, response, next) => {
    try {
      if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ error: "Case not found." });
      const ownedCase = await CaseModel.findOne({ _id: request.params.id, owner: request.user._id }).select("_id").lean().exec();
      if (!ownedCase) return response.status(404).json({ error: "Case not found." });
      const relationships = await RelationshipModel.find({ caseId: ownedCase._id }).sort({ createdAt: 1 }).lean().exec();
      return response.json({ relationships });
    } catch (error) { return next(error); }
  });

  router.post("/:id/relationships", async (request, response, next) => {
    try {
      if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ error: "Case not found." });
      const ownedCase = await CaseModel.findOne({ _id: request.params.id, owner: request.user._id }).select("_id").lean().exec();
      if (!ownedCase) return response.status(404).json({ error: "Case not found." });
      const fields = validRelationshipFields(request.body);
      if (!fields) return response.status(400).json({ error: "Relationship records and a note are required and must be valid." });
      const fromModel = { ClueModel, SuspectModel, EvidenceModel }[RECORD_MODELS[fields.fromType]];
      const toModel = { ClueModel, SuspectModel, EvidenceModel }[RECORD_MODELS[fields.toType]];
      const [fromRecord, toRecord] = await Promise.all([
        fromModel.findOne({ _id: fields.fromRecordId, caseId: ownedCase._id }).select("_id").lean().exec(),
        toModel.findOne({ _id: fields.toRecordId, caseId: ownedCase._id }).select("_id").lean().exec(),
      ]);
      if (!fromRecord || !toRecord) return response.status(404).json({ error: "Both records must belong to this case." });
      const relationship = await RelationshipModel.create({ ...fields, caseId: ownedCase._id });
      return response.status(201).json({ relationship });
    } catch (error) { return next(error); }
  });

  router.get("/:id", async (request, response, next) => {
    try {
      if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ error: "Case not found." });
      const found = await CaseModel.findOne({ _id: request.params.id, owner: request.user._id }).lean().exec();
      if (!found) return response.status(404).json({ error: "Case not found." });
      return response.json({ case: found });
    } catch (error) { return next(error); }
  });

  router.patch("/:id", async (request, response, next) => {
    try {
      const fields = validCaseFields(request.body, { partial: true });
      if (!fields) return response.status(400).json({ error: "Case fields are invalid." });
      if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ error: "Case not found." });
      const updated = await CaseModel.findOneAndUpdate(
        { _id: request.params.id, owner: request.user._id, archived: false },
        { $set: fields }, { new: true, runValidators: true },
      ).lean().exec();
      if (!updated) return response.status(404).json({ error: "Case not found." });
      return response.json({ case: updated });
    } catch (error) { return next(error); }
  });

  router.post("/:id/archive", async (request, response, next) => {
    try {
      if (!mongoose.isValidObjectId(request.params.id)) return response.status(404).json({ error: "Case not found." });
      const archived = await CaseModel.findOneAndUpdate(
        { _id: request.params.id, owner: request.user._id },
        { $set: { archived: true } }, { new: true },
      ).lean().exec();
      if (!archived) return response.status(404).json({ error: "Case not found." });
      return response.json({ case: archived });
    } catch (error) { return next(error); }
  });

  return router;
}

module.exports = { caseRouter, validCaseFields, validClueFields, validSuspectFields, validEvidenceFields, validRelationshipFields };

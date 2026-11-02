const { test } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { createApp } = require("../src/app");

class FakeUser {
  static records = new Map();
  constructor(fields) { Object.assign(this, fields); this._id = new mongoose.Types.ObjectId().toString(); }
  async save() {
    if ([...FakeUser.records.values()].some((user) => user.email === this.email)) {
      const error = new Error("duplicate"); error.code = 11000; throw error;
    }
    FakeUser.records.set(this._id, this);
    return this;
  }
  static findOne(filter) {
    return query(() => [...FakeUser.records.values()].find((user) => user.email === filter.email) || null);
  }
  static findById(id) { return query(() => FakeUser.records.get(String(id)) || null); }
}

class FakeCase {
  static records = new Map();
  static async create(fields) {
    const value = { ...fields, _id: new mongoose.Types.ObjectId().toString(), createdAt: new Date(), updatedAt: new Date(), archived: false };
    FakeCase.records.set(value._id, value);
    return value;
  }
  static find(filter) {
    return query(() => [...FakeCase.records.values()].filter((item) =>
      String(item.owner) === String(filter.owner)
      && (!filter.status || item.status === filter.status)
      && (!filter.title || filter.title.$regex.test(item.title))));
  }
  static countDocuments(filter) { return query(async () => (await FakeCase.find(filter).exec()).length); }
  static findOne(filter) {
    return query(() => {
      const item = FakeCase.records.get(String(filter._id));
      return item && String(item.owner) === String(filter.owner) ? item : null;
    });
  }
  static findOneAndUpdate(filter, update) {
    return query(() => {
      const item = FakeCase.records.get(String(filter._id));
      if (!item || String(item.owner) !== String(filter.owner) || (filter.archived === false && item.archived)) return null;
      Object.assign(item, update.$set, { updatedAt: new Date() });
      return item;
    });
  }
}

class FakeClue {
  static records = new Map();
  static async create(fields) {
    const value = { ...fields, _id: new mongoose.Types.ObjectId().toString(), createdAt: new Date(), updatedAt: new Date() };
    FakeClue.records.set(value._id, value);
    return value;
  }
  static find(filter) {
    return query(() => [...FakeClue.records.values()].filter((item) => String(item.caseId) === String(filter.caseId)));
  }
  static findOne(filter) { return query(() => { const item = FakeClue.records.get(String(filter._id)); return item && String(item.caseId) === String(filter.caseId) ? item : null; }); }
  static findOneAndUpdate(filter, update) {
    return query(() => {
      const item = FakeClue.records.get(String(filter._id));
      if (!item || String(item.caseId) !== String(filter.caseId)) return null;
      Object.assign(item, update.$set, { updatedAt: new Date() });
      return item;
    });
  }
}

class FakeSuspect {
  static records = new Map();
  static async create(fields) {
    const value = { ...fields, _id: new mongoose.Types.ObjectId().toString(), createdAt: new Date(), updatedAt: new Date() };
    FakeSuspect.records.set(value._id, value);
    return value;
  }
  static find(filter) { return query(() => [...FakeSuspect.records.values()].filter((item) => String(item.caseId) === String(filter.caseId))); }
  static findOne(filter) { return query(() => { const item = FakeSuspect.records.get(String(filter._id)); return item && String(item.caseId) === String(filter.caseId) ? item : null; }); }
  static findOneAndUpdate(filter, update) {
    return query(() => {
      const item = FakeSuspect.records.get(String(filter._id));
      if (!item || String(item.caseId) !== String(filter.caseId)) return null;
      Object.assign(item, update.$set, { updatedAt: new Date() }); return item;
    });
  }
  static findOneAndDelete(filter) {
    return query(() => {
      const item = FakeSuspect.records.get(String(filter._id));
      if (!item || String(item.caseId) !== String(filter.caseId)) return null;
      FakeSuspect.records.delete(String(filter._id)); return item;
    });
  }
}

class FakeEvidence {
  static records = new Map();
  static async create(fields) {
    const value = { ...fields, _id: new mongoose.Types.ObjectId().toString(), createdAt: new Date(), updatedAt: new Date() };
    FakeEvidence.records.set(value._id, value);
    return value;
  }
  static find(filter) { return query(() => [...FakeEvidence.records.values()].filter((item) => String(item.caseId) === String(filter.caseId))); }
  static findOne(filter) { return query(() => { const item = FakeEvidence.records.get(String(filter._id)); return item && String(item.caseId) === String(filter.caseId) ? item : null; }); }
  static findOneAndUpdate(filter, update) {
    return query(() => {
      const item = FakeEvidence.records.get(String(filter._id));
      if (!item || String(item.caseId) !== String(filter.caseId)) return null;
      Object.assign(item, update.$set, { updatedAt: new Date() }); return item;
    });
  }
  static findOneAndDelete(filter) {
    return query(() => {
      const item = FakeEvidence.records.get(String(filter._id));
      if (!item || String(item.caseId) !== String(filter.caseId)) return null;
      FakeEvidence.records.delete(String(item._id)); return item;
    });
  }
}

class FakeRelationship {
  static records = new Map();
  static async create(fields) {
    const value = { ...fields, _id: new mongoose.Types.ObjectId().toString(), createdAt: new Date(), updatedAt: new Date() };
    FakeRelationship.records.set(value._id, value);
    return value;
  }
  static find(filter) { return query(() => [...FakeRelationship.records.values()].filter((item) => String(item.caseId) === String(filter.caseId))); }
}

function query(resolve) {
  return {
    select() { return this; }, sort() { return this; }, skip() { return this; }, limit() { return this; }, lean() { return this; },
    exec() { return Promise.resolve().then(resolve); },
  };
}

async function start(t) {
  FakeUser.records.clear();
  FakeCase.records.clear();
  FakeClue.records.clear();
  FakeSuspect.records.clear();
  FakeEvidence.records.clear();
  FakeRelationship.records.clear();
  const app = createApp({
    UserModel: FakeUser,
    CaseModel: FakeCase,
    ClueModel: FakeClue,
    SuspectModel: FakeSuspect,
    EvidenceModel: FakeEvidence,
    RelationshipModel: FakeRelationship,
    sessionSecret: "test-session-secret-which-is-long-enough-123456",
    bcryptImpl: bcrypt,
  });
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  return `http://127.0.0.1:${server.address().port}`;
}

async function request(base, route, { method = "GET", body, cookie } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = cookie;
  return fetch(`${base}${route}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

function cookieFrom(response) {
  const value = response.headers.get("set-cookie");
  assert.ok(value, "expected a session cookie");
  return value.split(";")[0];
}

test("health keeps the existing safe response shape", async (t) => {
  const base = await start(t);
  const response = await request(base, "/health");
  const body = await response.json();
  assert.deepEqual(Object.keys(body).sort(), ["database", "status"]);
  assert.ok([200, 503].includes(response.status));
});

test("registration validates inputs, hashes passwords, logs in, and logout revokes access", async (t) => {
  const base = await start(t);
  const invalid = await request(base, "/api/auth/register", { method: "POST", body: { email: "bad", password: "short" } });
  assert.equal(invalid.status, 400);

  const registered = await request(base, "/api/auth/register", {
    method: "POST", body: { email: "  DETECTIVE@example.com ", password: "correct horse 123" },
  });
  assert.equal(registered.status, 201);
  const firstCookie = cookieFrom(registered);
  const body = await registered.json();
  assert.equal(body.user.email, "detective@example.com");
  assert.equal(Object.hasOwn(body.user, "passwordHash"), false);
  const stored = [...FakeUser.records.values()][0];
  assert.notEqual(stored.passwordHash, "correct horse 123");
  assert.equal(await bcrypt.compare("correct horse 123", stored.passwordHash), true);

  const duplicate = await request(base, "/api/auth/register", {
    method: "POST", body: { email: "detective@example.com", password: "correct horse 123" },
  });
  assert.equal(duplicate.status, 409);
  const me = await request(base, "/api/auth/me", { cookie: firstCookie });
  assert.equal(me.status, 200);

  const loggedOut = await request(base, "/api/auth/logout", { method: "POST", cookie: firstCookie });
  assert.equal(loggedOut.status, 204);
  const afterLogout = await request(base, "/api/auth/me", { cookie: firstCookie });
  assert.equal(afterLogout.status, 401);

  const login = await request(base, "/api/auth/login", {
    method: "POST", body: { email: "DETECTIVE@example.com", password: "correct horse 123" },
  });
  assert.equal(login.status, 200);
  assert.ok(cookieFrom(login));
  const wrongPassword = await request(base, "/api/auth/login", {
    method: "POST", body: { email: "detective@example.com", password: "wrong password 123" },
  });
  assert.equal(wrongPassword.status, 401);
});

test("case routes require login and scope reads and writes to the current owner", async (t) => {
  const base = await start(t);
  const unauthenticated = await request(base, "/api/cases");
  assert.equal(unauthenticated.status, 401);

  const register = async (email) => request(base, "/api/auth/register", {
    method: "POST", body: { email, password: "secure investigation 42" },
  });
  const firstRegistration = await register("one@example.com");
  const firstCookie = cookieFrom(firstRegistration);
  const created = await request(base, "/api/cases", {
    method: "POST", cookie: firstCookie, body: { title: "North pier", owner: "forged-owner" },
  });
  assert.equal(created.status, 400, "clients cannot supply owner fields");
  const ownCase = await request(base, "/api/cases", {
    method: "POST", cookie: firstCookie, body: { title: "North pier" },
  });
  assert.equal(ownCase.status, 201);
  const caseId = (await ownCase.json()).case._id;

  const secondRegistration = await register("two@example.com");
  const secondCookie = cookieFrom(secondRegistration);
  const otherUserRead = await request(base, `/api/cases/${caseId}`, { cookie: secondCookie });
  assert.equal(otherUserRead.status, 404);
  const otherUserUpdate = await request(base, `/api/cases/${caseId}`, {
    method: "PATCH", cookie: secondCookie, body: { title: "Hijacked" },
  });
  assert.equal(otherUserUpdate.status, 404);

  const ownList = await request(base, "/api/cases", { cookie: firstCookie });
  assert.equal((await ownList.json()).total, 1);
  const otherList = await request(base, "/api/cases", { cookie: secondCookie });
  assert.equal((await otherList.json()).total, 0);
});

test("clue routes require authentication, validate fields, and enforce case ownership", async (t) => {
  const base = await start(t);
  const unauthenticatedList = await request(base, `/api/cases/${new mongoose.Types.ObjectId()}/clues`);
  assert.equal(unauthenticatedList.status, 401);
  const unauthenticatedCreate = await request(base, `/api/cases/${new mongoose.Types.ObjectId()}/clues`, {
    method: "POST", body: { title: "Lead", details: "A detail" },
  });
  assert.equal(unauthenticatedCreate.status, 401);

  const register = async (email) => request(base, "/api/auth/register", {
    method: "POST", body: { email, password: "secure investigation 42" },
  });
  const firstCookie = cookieFrom(await register("clue-owner@example.com"));
  const ownerCaseResponse = await request(base, "/api/cases", {
    method: "POST", cookie: firstCookie, body: { title: "Owner case" },
  });
  const ownerCaseId = (await ownerCaseResponse.json()).case._id;

  const invalidMissingDetails = await request(base, `/api/cases/${ownerCaseId}/clues`, {
    method: "POST", cookie: firstCookie, body: { title: "Incomplete clue" },
  });
  assert.equal(invalidMissingDetails.status, 400);
  const invalidLongTitle = await request(base, `/api/cases/${ownerCaseId}/clues`, {
    method: "POST", cookie: firstCookie, body: { title: "x".repeat(161), details: "Some details" },
  });
  assert.equal(invalidLongTitle.status, 400);

  const created = await request(base, `/api/cases/${ownerCaseId}/clues`, {
    method: "POST", cookie: firstCookie, body: { title: "  Camera lead  ", details: "  Check the loading entrance.  " },
  });
  assert.equal(created.status, 201);
  const clue = (await created.json()).clue;
  assert.equal(clue.title, "Camera lead");
  assert.equal(clue.details, "Check the loading entrance.");
  assert.equal(String(clue.caseId), ownerCaseId);

  const listed = await request(base, `/api/cases/${ownerCaseId}/clues`, { cookie: firstCookie });
  assert.equal(listed.status, 200);
  assert.equal((await listed.json()).clues[0]._id, clue._id);

  const edited = await request(base, `/api/cases/${ownerCaseId}/clues/${clue._id}`, {
    method: "PATCH", cookie: firstCookie, body: { title: "Updated camera lead", details: "Review the rear entrance footage." },
  });
  assert.equal(edited.status, 200);
  assert.equal((await edited.json()).clue.title, "Updated camera lead");

  const secondCookie = cookieFrom(await register("other-clue-owner@example.com"));
  const forbiddenList = await request(base, `/api/cases/${ownerCaseId}/clues`, { cookie: secondCookie });
  assert.equal(forbiddenList.status, 404);
  const forbiddenCreate = await request(base, `/api/cases/${ownerCaseId}/clues`, {
    method: "POST", cookie: secondCookie, body: { title: "Intrusion", details: "Should not save." },
  });
  assert.equal(forbiddenCreate.status, 404);
  const forbiddenEdit = await request(base, `/api/cases/${ownerCaseId}/clues/${clue._id}`, {
    method: "PATCH", cookie: secondCookie, body: { title: "Tampered clue" },
  });
  assert.equal(forbiddenEdit.status, 404);

  const secondCaseResponse = await request(base, "/api/cases", {
    method: "POST", cookie: secondCookie, body: { title: "Other case" },
  });
  const secondCaseId = (await secondCaseResponse.json()).case._id;
  const crossCaseEdit = await request(base, `/api/cases/${secondCaseId}/clues/${clue._id}`, {
    method: "PATCH", cookie: secondCookie, body: { title: "Cross-case edit" },
  });
  assert.equal(crossCaseEdit.status, 404);
});

test("suspect routes provide validated CRUD and enforce authentication, case ownership, and case scoping", async (t) => {
  const base = await start(t);
  const caseId = new mongoose.Types.ObjectId().toString();
  assert.equal((await request(base, `/api/cases/${caseId}/suspects`)).status, 401);
  assert.equal((await request(base, `/api/cases/${caseId}/suspects`, { method: "POST", body: { name: "Mira", details: "Unverified." } })).status, 401);
  const register = async (email) => request(base, "/api/auth/register", { method: "POST", body: { email, password: "secure investigation 42" } });
  const ownerCookie = cookieFrom(await register("suspect-owner@example.com"));
  const createdCase = await request(base, "/api/cases", { method: "POST", cookie: ownerCookie, body: { title: "Laptop inquiry" } });
  const ownCaseId = (await createdCase.json()).case._id;
  assert.equal((await request(base, `/api/cases/${ownCaseId}/suspects`, { method: "POST", cookie: ownerCookie, body: { name: "Mira" } })).status, 400);
  assert.equal((await request(base, `/api/cases/${ownCaseId}/suspects`, { method: "POST", cookie: ownerCookie, body: { name: "x".repeat(161), details: "Unverified." } })).status, 400);
  const created = await request(base, `/api/cases/${ownCaseId}/suspects`, { method: "POST", cookie: ownerCookie, body: { name: " Mira ", details: " Fictional student; involvement unverified. " } });
  assert.equal(created.status, 201);
  const suspect = (await created.json()).suspect;
  assert.equal(suspect.name, "Mira"); assert.equal(String(suspect.caseId), ownCaseId);
  assert.equal((await request(base, `/api/cases/${ownCaseId}/suspects/${suspect._id}`, { method: "PATCH", body: { name: "Unauthenticated edit" } })).status, 401);
  assert.equal((await request(base, `/api/cases/${ownCaseId}/suspects/${suspect._id}`, { method: "DELETE" })).status, 401);
  const listed = await request(base, `/api/cases/${ownCaseId}/suspects`, { cookie: ownerCookie });
  assert.equal((await listed.json()).suspects[0]._id, suspect._id);
  const edited = await request(base, `/api/cases/${ownCaseId}/suspects/${suspect._id}`, { method: "PATCH", cookie: ownerCookie, body: { name: "Mira N." } });
  assert.equal(edited.status, 200); assert.equal((await edited.json()).suspect.name, "Mira N.");
  assert.equal((await request(base, `/api/cases/${ownCaseId}/suspects/${suspect._id}`, { method: "PATCH", cookie: ownerCookie, body: { details: "  " } })).status, 400);
  const otherCookie = cookieFrom(await register("other-suspect-owner@example.com"));
  assert.equal((await request(base, `/api/cases/${ownCaseId}/suspects`, { cookie: otherCookie })).status, 404);
  assert.equal((await request(base, `/api/cases/${ownCaseId}/suspects`, { method: "POST", cookie: otherCookie, body: { name: "Dev", details: "Unverified." } })).status, 404);
  assert.equal((await request(base, `/api/cases/${ownCaseId}/suspects/${suspect._id}`, { method: "PATCH", cookie: otherCookie, body: { name: "Tampered" } })).status, 404);
  assert.equal((await request(base, `/api/cases/${ownCaseId}/suspects/${suspect._id}`, { method: "DELETE", cookie: otherCookie })).status, 404);
  const deleted = await request(base, `/api/cases/${ownCaseId}/suspects/${suspect._id}`, { method: "DELETE", cookie: ownerCookie });
  assert.equal(deleted.status, 204);
  assert.equal((await request(base, `/api/cases/${ownCaseId}/suspects/${suspect._id}`, { method: "DELETE", cookie: ownerCookie })).status, 404);
});

test("evidence routes provide validated CRUD and enforce authentication, case ownership, and case scoping", async (t) => {
  const base = await start(t);
  const unknownCaseId = new mongoose.Types.ObjectId().toString();
  assert.equal((await request(base, `/api/cases/${unknownCaseId}/evidence`)).status, 401);
  assert.equal((await request(base, `/api/cases/${unknownCaseId}/evidence`, { method: "POST", body: { title: "Item", details: "Details" } })).status, 401);
  const register = async (email) => request(base, "/api/auth/register", { method: "POST", body: { email, password: "secure investigation 42" } });
  const ownerCookie = cookieFrom(await register("evidence-owner@example.com"));
  const ownerCaseResponse = await request(base, "/api/cases", { method: "POST", cookie: ownerCookie, body: { title: "Evidence inquiry" } });
  const ownerCaseId = (await ownerCaseResponse.json()).case._id;

  assert.equal((await request(base, `/api/cases/${ownerCaseId}/evidence`, { method: "POST", cookie: ownerCookie, body: { title: "Missing details" } })).status, 400);
  assert.equal((await request(base, `/api/cases/${ownerCaseId}/evidence`, { method: "POST", cookie: ownerCookie, body: { title: "x".repeat(161), details: "Too long" } })).status, 400);
  const created = await request(base, `/api/cases/${ownerCaseId}/evidence`, {
    method: "POST", cookie: ownerCookie, body: { title: "  Lab notebook  ", details: "  Collected from the east bench.  " },
  });
  assert.equal(created.status, 201);
  const evidence = (await created.json()).evidence;
  assert.equal(evidence.title, "Lab notebook");
  assert.equal(evidence.details, "Collected from the east bench.");
  assert.equal(String(evidence.caseId), ownerCaseId);

  const listed = await request(base, `/api/cases/${ownerCaseId}/evidence`, { cookie: ownerCookie });
  assert.equal(listed.status, 200);
  assert.equal((await listed.json()).evidence[0]._id, evidence._id);
  const edited = await request(base, `/api/cases/${ownerCaseId}/evidence/${evidence._id}`, {
    method: "PATCH", cookie: ownerCookie, body: { title: "Updated lab notebook", details: "Review the notes and collection location." },
  });
  assert.equal(edited.status, 200);
  assert.equal((await edited.json()).evidence.title, "Updated lab notebook");
  assert.equal((await request(base, `/api/cases/${ownerCaseId}/evidence/${evidence._id}`, { method: "PATCH", cookie: ownerCookie, body: { details: "  " } })).status, 400);

  const otherCookie = cookieFrom(await register("other-evidence-owner@example.com"));
  assert.equal((await request(base, `/api/cases/${ownerCaseId}/evidence`, { cookie: otherCookie })).status, 404);
  assert.equal((await request(base, `/api/cases/${ownerCaseId}/evidence`, { method: "POST", cookie: otherCookie, body: { title: "Unauthorized", details: "Must not be created." } })).status, 404);
  assert.equal((await request(base, `/api/cases/${ownerCaseId}/evidence/${evidence._id}`, { method: "PATCH", cookie: otherCookie, body: { title: "Tampered" } })).status, 404);
  assert.equal((await request(base, `/api/cases/${ownerCaseId}/evidence/${evidence._id}`, { method: "DELETE", cookie: otherCookie })).status, 404);

  const deleted = await request(base, `/api/cases/${ownerCaseId}/evidence/${evidence._id}`, { method: "DELETE", cookie: ownerCookie });
  assert.equal(deleted.status, 204);
  assert.equal((await request(base, `/api/cases/${ownerCaseId}/evidence/${evidence._id}`, { method: "DELETE", cookie: ownerCookie })).status, 404);
});

test("relationship routes require login, validate both case records, and list only owned-case relationships", async (t) => {
  const base = await start(t);
  const randomCaseId = new mongoose.Types.ObjectId().toString();
  assert.equal((await request(base, `/api/cases/${randomCaseId}/relationships`)).status, 401);
  assert.equal((await request(base, `/api/cases/${randomCaseId}/relationships`, { method: "POST", body: {} })).status, 401);

  const register = async (email) => request(base, "/api/auth/register", { method: "POST", body: { email, password: "secure investigation 42" } });
  const ownerCookie = cookieFrom(await register("relationship-owner@example.com"));
  const ownCaseResponse = await request(base, "/api/cases", { method: "POST", cookie: ownerCookie, body: { title: "Connected records" } });
  const ownCaseId = (await ownCaseResponse.json()).case._id;
  const otherCaseResponse = await request(base, "/api/cases", { method: "POST", cookie: ownerCookie, body: { title: "Separate records" } });
  const otherCaseId = (await otherCaseResponse.json()).case._id;

  const createRecord = async (caseId, kind, body) => request(base, `/api/cases/${caseId}/${kind}`, { method: "POST", cookie: ownerCookie, body });
  const clue = (await (await createRecord(ownCaseId, "clues", { title: "Camera timestamp", details: "Recorded at 21:14." })).json()).clue;
  const suspect = (await (await createRecord(ownCaseId, "suspects", { name: "Mira", details: "Timeline unverified." })).json()).suspect;
  const evidence = (await (await createRecord(ownCaseId, "evidence", { title: "Lab notebook", details: "Collected from the east bench." })).json()).evidence;
  const crossCaseEvidence = (await (await createRecord(otherCaseId, "evidence", { title: "Other case item", details: "Belongs to another case." })).json()).evidence;

  const invalidType = await request(base, `/api/cases/${ownCaseId}/relationships`, {
    method: "POST", cookie: ownerCookie, body: { fromType: "user", fromRecordId: clue._id, toType: "suspect", toRecordId: suspect._id, note: "Invalid record type." },
  });
  assert.equal(invalidType.status, 400);
  const selfLink = await request(base, `/api/cases/${ownCaseId}/relationships`, {
    method: "POST", cookie: ownerCookie, body: { fromType: "clue", fromRecordId: clue._id, toType: "clue", toRecordId: clue._id, note: "Self link." },
  });
  assert.equal(selfLink.status, 400);
  const missingNote = await request(base, `/api/cases/${ownCaseId}/relationships`, {
    method: "POST", cookie: ownerCookie, body: { fromType: "clue", fromRecordId: clue._id, toType: "suspect", toRecordId: suspect._id, note: " " },
  });
  assert.equal(missingNote.status, 400);

  const first = await request(base, `/api/cases/${ownCaseId}/relationships`, {
    method: "POST", cookie: ownerCookie,
    body: { fromType: "clue", fromRecordId: clue._id, toType: "suspect", toRecordId: suspect._id, note: "The timestamp places Mira near the lab." },
  });
  assert.equal(first.status, 201);
  const firstRelationship = (await first.json()).relationship;
  assert.equal(String(firstRelationship.caseId), ownCaseId);
  assert.equal(firstRelationship.note, "The timestamp places Mira near the lab.");

  const second = await request(base, `/api/cases/${ownCaseId}/relationships`, {
    method: "POST", cookie: ownerCookie,
    body: { fromType: "evidence", fromRecordId: evidence._id, toType: "clue", toRecordId: clue._id, note: "Notebook time matches the camera log." },
  });
  assert.equal(second.status, 201);
  const crossCaseRecord = await request(base, `/api/cases/${ownCaseId}/relationships`, {
    method: "POST", cookie: ownerCookie,
    body: { fromType: "clue", fromRecordId: clue._id, toType: "evidence", toRecordId: crossCaseEvidence._id, note: "Should not connect across cases." },
  });
  assert.equal(crossCaseRecord.status, 404);

  const listed = await request(base, `/api/cases/${ownCaseId}/relationships`, { cookie: ownerCookie });
  assert.equal(listed.status, 200);
  const relationships = (await listed.json()).relationships;
  assert.equal(relationships.length, 2);
  assert.ok(relationships.some((item) => item._id === firstRelationship._id));
  const otherCookie = cookieFrom(await register("other-relationship-owner@example.com"));
  assert.equal((await request(base, `/api/cases/${ownCaseId}/relationships`, { cookie: otherCookie })).status, 404);
});

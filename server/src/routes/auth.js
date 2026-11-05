const express = require("express");
const bcrypt = require("bcrypt");
const { requireAuth } = require("../middleware/auth");
const { authRateLimit } = require("../middleware/authRateLimit");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_BYTES = 72;

function publicUser(user) {
  return { id: String(user._id || user.id), email: user.email };
}

function validCredentials(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return null;
  if (password.length < PASSWORD_MIN_LENGTH || Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) return null;
  return { email, password };
}

function regenerate(session) {
  return new Promise((resolve, reject) => session.regenerate((error) => error ? reject(error) : resolve()));
}

function save(session) {
  return new Promise((resolve, reject) => session.save((error) => error ? reject(error) : resolve()));
}

function destroy(session) {
  return new Promise((resolve, reject) => session.destroy((error) => error ? reject(error) : resolve()));
}

function authRouter({ UserModel, bcryptImpl = bcrypt }) {
  const router = express.Router();
  const limitAuthAttempts = authRateLimit();

  router.post("/register", limitAuthAttempts, async (request, response, next) => {
    try {
      const credentials = validCredentials(request.body);
      if (!credentials) {
        return response.status(400).json({
          error: `Enter a valid email and a password of ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_BYTES} UTF-8 bytes.`,
        });
      }
      const existing = await UserModel.findOne({ email: credentials.email }).select("_id").exec();
      if (existing) return response.status(409).json({ error: "An account with that email already exists." });

      const passwordHash = await bcryptImpl.hash(credentials.password, 12);
      const user = await new UserModel({ email: credentials.email, passwordHash }).save();
      await regenerate(request.session);
      request.session.userId = String(user._id || user.id);
      await save(request.session);
      return response.status(201).json({ user: publicUser(user) });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/login", limitAuthAttempts, async (request, response, next) => {
    try {
      const credentials = validCredentials(request.body);
      if (!credentials) return response.status(400).json({ error: "Enter a valid email and password." });
      const user = await UserModel.findOne({ email: credentials.email }).select("+passwordHash").exec();
      const matches = user && await bcryptImpl.compare(credentials.password, user.passwordHash);
      if (!matches) return response.status(401).json({ error: "Email or password is incorrect." });
      await regenerate(request.session);
      request.session.userId = String(user._id || user.id);
      await save(request.session);
      return response.status(200).json({ user: publicUser(user) });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/logout", async (request, response, next) => {
    try {
      if (request.session) await destroy(request.session);
      response.clearCookie("investigation.sid", {
        httpOnly: true,
        sameSite: "none",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      return response.status(204).end();
    } catch (error) {
      return next(error);
    }
  });

  router.get("/me", requireAuth(UserModel), (request, response) => {
    response.json({ user: publicUser(request.user) });
  });

  return router;
}

module.exports = { authRouter, validCredentials, publicUser };

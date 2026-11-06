
const path = require("node:path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const mongoose = require("mongoose");

const User = require("./models/User");
const Case = require("./models/Case");
const Clue = require("./models/Clue");
const Suspect = require("./models/Suspect");
const Evidence = require("./models/Evidence");
const Relationship = require("./models/Relationship");

const { authRouter } = require("./routes/auth");
const { caseRouter } = require("./routes/cases");

const cookieName = "investigation.sid";

const cookieOptions = {
  httpOnly: true,
  sameSite: "none",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

const allowedOrigins = [
  "https://ai-investigation-room-jet.vercel.app",
  "http://localhost:5173",
];

function createApp({
  UserModel = User,
  CaseModel = Case,
  ClueModel = Clue,
  SuspectModel = Suspect,
  EvidenceModel = Evidence,
  RelationshipModel = Relationship,
  sessionStore,
  sessionSecret = process.env.SESSION_SECRET,
  bcryptImpl,
} = {}) {
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error(
      "SESSION_SECRET must contain at least 32 characters."
    );
  }

  const app = express();

  // Trust Render proxy in production
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  // CORS - allow deployed frontend
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );

  // Security middleware
  app.disable("x-powered-by");
  app.use(helmet());

  // Parse JSON
  app.use(express.json({ limit: "16kb" }));

  // Session middleware
  app.use(
    session({
      name: cookieName,
      secret: sessionSecret,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        ...cookieOptions,
        maxAge: 8 * 60 * 60 * 1000,
      },
    })
  );

  // Health check
  app.get("/health", (_request, response) => {
    const databaseConnected =
      mongoose.connection.readyState === 1;

    response
      .status(databaseConnected ? 200 : 503)
      .json({
        status: databaseConnected ? "ok" : "unavailable",
        database: databaseConnected
          ? "connected"
          : "disconnected",
      });
  });

  // API routes
  app.use(
    "/api/auth",
    authRouter({ UserModel, bcryptImpl })
  );

  app.use(
    "/api/cases",
    caseRouter({
      CaseModel,
      ClueModel,
      SuspectModel,
      EvidenceModel,
      RelationshipModel,
      UserModel,
    })
  );

  // Frontend static files in production
  if (process.env.NODE_ENV === "production") {
    const clientDist = path.resolve(
      __dirname,
      "../../client/dist"
    );

    app.use(express.static(clientDist));

    // Frontend fallback (exclude API routes)
    app.get(
      /^\/(?!api(?:\/|$)).*/,
      (_request, response, next) => {
        response.sendFile(
          path.join(clientDist, "index.html"),
          (error) => {
            if (error) next(error);
          }
        );
      }
    );
  }

  // 404 handler
  app.use((_request, response) => {
    response.status(404).json({
      error: "Not found.",
    });
  });

  // Error handler
  app.use((error, _request, response, _next) => {
    if (error.type === "entity.parse.failed") {
      return response.status(400).json({
        error: "Request body must contain valid JSON.",
      });
    }

    if (error.name === "ValidationError") {
      return response.status(400).json({
        error: "Input is invalid.",
      });
    }

    if (error.code === 11000) {
      return response.status(409).json({
        error: "An account with that email already exists.",
      });
    }

    if (
      [400, 401, 404, 409, 429].includes(error.status)
    ) {
      return response.status(error.status).json({
        error:
          error.publicMessage ||
          "Request could not be completed.",
      });
    }

    console.error("Request failed.");

    return response.status(500).json({
      error: "The server could not complete the request.",
    });
  });

  return app;
}

module.exports = { createApp };

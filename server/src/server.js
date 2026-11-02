const path = require("node:path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { MongoStore } = require("connect-mongo");
const { connectToDatabase } = require("./config/database");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const { createApp } = require("./app");

const port = Number(process.env.PORT || 5000);
let app;
let httpServer;
let isShuttingDown = false;

function listen(applicationPort) {
  return new Promise((resolve, reject) => {
    const server = app.listen(applicationPort, "0.0.0.0");

    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

async function startServer() {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid port number between 1 and 65535.");
  }

  await connectToDatabase(process.env.MONGODB_URI);
  const sessionStore = MongoStore.create({
    client: mongoose.connection.getClient(),
    collectionName: "sessions",
  });
  app = createApp({ sessionStore });
  httpServer = await listen(port);

  mongoose.connection.on("disconnected", () => {
    console.error("MongoDB disconnected. Readiness checks will fail until it reconnects.");
  });

  mongoose.connection.on("error", () => {
    console.error("MongoDB reported a connection error.");
  });

  console.log(`API server listening on port ${port}.`);
}

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`${signal} received. Shutting down gracefully.`);

  const forceExitTimer = setTimeout(() => {
    console.error("Shutdown timed out.");
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  try {
    if (httpServer) {
      await new Promise((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
      });
    }

    await mongoose.disconnect();
    console.log("Shutdown complete.");
  } catch {
    console.error("Shutdown encountered an error.");
    process.exitCode = 1;
  } finally {
    clearTimeout(forceExitTimer);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer().catch(async (error) => {
  console.error(error.message || "The API server could not start.");
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});

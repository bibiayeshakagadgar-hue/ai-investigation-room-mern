
const mongoose = require("mongoose");

async function connectToDatabase(uri) {
  if (!uri || !uri.trim()) {
    throw new Error("MONGODB_URI is not configured.");
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      tls: true,
      minHeartbeatFrequencyMS: 1000,
    });

    console.log("MongoDB connected successfully.");
    return mongoose.connection;
  
  } catch (error) {
    console.error("MongoDB error:", error.message);

    const servers = error.reason?.servers;

    if (servers) {
      for (const [address, server] of servers) {
        console.error("Server:", address);
        console.error("Status:", server.type);
        console.error(
          "Error:",
          server.error?.message || "No server error details"
        );
      }
    }

    throw error;
  }

}

module.exports = { connectToDatabase };


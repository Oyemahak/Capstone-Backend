// src/config/db.js
import mongoose from "mongoose";
import { requiredEnv, sanitizeErrorCategory } from "./env.js";

export default async function connectDB() {
  const uri = requiredEnv("MONGO_URI");

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 10000),
      connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 10000),
      socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10),
    });
    console.log("MongoDB connected");
  } catch (err) {
    err.safeCategory = sanitizeErrorCategory(err);
    throw err;
  }
}

export function mongoState() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[mongoose.connection.readyState] || "unknown";
}

import { mongoState } from "../config/db.js";
import { storageStatus } from "./supabase.js";

export function healthPayload() {
  const storage = storageStatus();
  return {
    success: true,
    service: "mspixelpulse-api",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    mongodb: {
      state: mongoState(),
      connected: mongoState() === "connected",
    },
    supabase: {
      configured: storage.supabaseConfigured,
    },
    storage: {
      bucketConfigured: storage.storageBucketConfigured,
    },
  };
}

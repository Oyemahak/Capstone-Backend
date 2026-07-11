export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function requiredEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    const err = new Error(`${name} is required`);
    err.code = "ENV_MISSING";
    err.envName = name;
    throw err;
  }
  return String(value).trim();
}

export function boolEnv(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

export function sanitizeErrorCategory(err) {
  const code = err?.code || err?.name || "";
  const message = String(err?.message || "").toLowerCase();

  if (code === "ENV_MISSING") return "missing_environment";
  if (code === "ENOTFOUND" || code === "ESERVFAIL" || message.includes("querysrv")) return "dns_failure";
  if (message.includes("authentication failed") || code === 18) return "authentication_failure";
  if (message.includes("server selection") || code === "MongooseServerSelectionError") return "server_selection_timeout";
  if (message.includes("timed out") || message.includes("timeout")) return "timeout";
  if (message.includes("network")) return "network_failure";
  return "startup_failure";
}

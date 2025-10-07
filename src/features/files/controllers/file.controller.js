// backend/src/features/files/controllers/file.controller.js
import crypto from "crypto";
import { putObject, signedURL, removeObject } from "../../../lib/storage.js";

export async function uploadBuffer(req, res, next) {
  try {
    const { fileName = "upload.bin", contentType = "application/octet-stream", base64 } = req.body || {};
    if (!base64) return res.status(400).json({ error: "base64 is required" });

    const name = fileName.replace(/[^\w.\- ]+/g, "");
    const buffer = Buffer.from(base64.split(",").pop(), "base64");
    const key = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${name}`;

    const { path, url } = await putObject({ path: key, buffer, contentType });
    const downloadUrl = await signedURL(path);
    res.status(201).json({ ok: true, path, url, downloadUrl, name, type: contentType, size: buffer.length });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const { path } = req.body || {};
    if (!path) return res.status(400).json({ error: "path is required" });
    await removeObject(path);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
// backend/src/routes/files.routes.js
import { Router } from "express";
import multer from "multer";
import { uploadBuffer } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Keep files in memory; we send buffers to Supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB cap (adjust if you want)
});

// POST /api/files/upload
router.post(
  "/files/upload",
  requireAuth,
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: "file required" });

      const { originalname, mimetype, size, buffer } = req.file;

      // safe-ish path: /uploads/YYYY/MM/<ts>_<clean-name>
      const now = new Date();
      const yyyy = now.getUTCFullYear();
      const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
      const clean = String(originalname).replace(/[^\w.\-]+/g, "_");
      const path = `uploads/${yyyy}/${mm}/${Date.now()}_${clean}`;

      const { url } = await uploadBuffer(path, buffer, mimetype);

      res.json({
        file: {
          name: originalname,
          type: mimetype,
          size,
          path,
          url,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
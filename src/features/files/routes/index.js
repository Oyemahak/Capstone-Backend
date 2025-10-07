// backend/src/features/files/routes/index.js
import { Router } from "express";
import { uploadBuffer, remove } from "../controllers/file.controller.js";

const router = Router();
router.post("/upload", uploadBuffer);
router.delete("/remove", remove);
export default router;
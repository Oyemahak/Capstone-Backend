// src/features/leads/routes/index.js
import { Router } from "express";
import { createLead } from "../controllers/lead.controller.js";

const router = Router();

// POST /api/contact
router.post("/", createLead);

export default router;
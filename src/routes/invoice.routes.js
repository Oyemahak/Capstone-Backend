// backend/src/routes/invoice.routes.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from "../features/projects/controllers/invoice.controller.js";

const router = Router();

// GET   /api/projects/:projectId/invoices
router.get("/projects/:projectId/invoices", requireAuth, listInvoices);

// POST  /api/projects/:projectId/invoices
router.post("/projects/:projectId/invoices", requireAuth, createInvoice);

// PATCH /api/projects/:projectId/invoices/:invoiceId
router.patch(
  "/projects/:projectId/invoices/:invoiceId",
  requireAuth,
  updateInvoice
);

// DELETE /api/projects/:projectId/invoices/:invoiceId
router.delete(
  "/projects/:projectId/invoices/:invoiceId",
  requireAuth,
  deleteInvoice
);

export default router;
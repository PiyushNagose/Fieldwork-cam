const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const invoiceController = require("../controllers/invoice.controller");

const router = express.Router();

router.get("/", authMiddleware, invoiceController.getInvoices);

router.post("/create", authMiddleware, invoiceController.createInvoice);
router.get(
  "/project/:projectId",
  authMiddleware,
  invoiceController.getInvoiceByProject,
);
router.get("/:invoiceId", authMiddleware, invoiceController.getInvoiceById);

module.exports = router;

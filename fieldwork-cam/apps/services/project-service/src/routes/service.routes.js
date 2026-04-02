const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const validateMiddleware = require("../middlewares/validate.middleware");
const serviceController = require("../controllers/service.controller");
const { serviceValidator } = require("../validators/service.validator");

const router = express.Router();

router.get("/", authMiddleware, serviceController.getServices);
router.get("/:id", authMiddleware, serviceController.getService);

router.post(
  "/",
  authMiddleware,
  serviceValidator,
  validateMiddleware,
  serviceController.createService,
);

router.put(
  "/:id",
  authMiddleware,
  serviceValidator,
  validateMiddleware,
  serviceController.updateService,
);

module.exports = router;

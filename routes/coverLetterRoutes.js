import express from "express";
import { generateCoverLetter } from "../controllers/coverLetterController.js";
import { coverLetterSchema } from "../Schema/coverLetterSchema.js";

const router = express.Router();

// Middleware to validate request body
const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid request data",
      errors: result.error.errors,
    });
  }
  req.body = result.data;
  next();
};

// POST /api/cover-letter - Generate cover letter
router.post("/cover-letter", validateRequest(coverLetterSchema), generateCoverLetter);

export default router;
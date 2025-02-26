import express from 'express';
import { analyzeResume } from '../controllers/resumeAnalysisController.js'; // Adjust path as needed

const router = express.Router();

// Route to analyze resume
router.post('/resume', analyzeResume); // POST /api/ai-analysis/resume

export default router;
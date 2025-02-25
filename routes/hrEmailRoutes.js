import express from "express";
import { populateHRData, searchHR } from "../controllers/hrEmailController.js";

const router = express.Router();

router.post("/populate", populateHRData); // Insert sample HR data
router.get("/search", searchHR); // Search HR details

export default router;
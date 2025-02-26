import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  pdfData: {
    type: Buffer, // Store PDF as binary data
    required: true,
  },
  jobProfile: {
    type: String,
    required: true,
  },
  experienceLevel: {
    type: String,
    enum: ["entry", "mid", "senior"],
    required: true,
  },
  analysis: {
    score: Number,
    missingKeywords: [String],
    suggestions: [String],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;
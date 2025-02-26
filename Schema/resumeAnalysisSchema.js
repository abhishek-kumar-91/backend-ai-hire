import { z } from "zod";

const resumeAnalysisSchema = z.object({
  jobProfile: z.string().min(1, "Job profile is required"),
  experienceLevel: z.enum(["entry", "mid", "senior"], {
    message: "Experience level must be 'entry', 'mid', or 'senior'",
  }),
}).strict();

export { resumeAnalysisSchema };
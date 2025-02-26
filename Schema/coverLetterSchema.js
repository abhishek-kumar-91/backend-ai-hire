import { z } from "zod";

const coverLetterSchema = z.object({
  jobDescription: z.string(),
  userDetails: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    experience: z.string().optional(),
  }).optional(),
}).strict();

export { coverLetterSchema };
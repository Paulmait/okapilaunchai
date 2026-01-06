import { z } from "zod";

// ---------- Wizard / Project Creation ----------

export const WizardPayloadSchema = z.object({
  name: z
    .string()
    .min(2, "App name must be at least 2 characters")
    .max(100, "App name must be at most 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, "App name contains invalid characters"),
  category: z.enum([
    "Utilities",
    "Productivity",
    "Health & Fitness",
    "Education",
    "Travel",
    "Entertainment",
    "Finance",
    "Social",
    "Lifestyle",
    "Other"
  ]),
  authApple: z.boolean(),
  subscription: z.boolean(),
  backend: z.enum(["supabase", "firebase"]),
  deleteMyData: z.boolean()
});

export type WizardPayload = z.infer<typeof WizardPayloadSchema>;

// ---------- Job Types ----------

export const JobTypeSchema = z.enum([
  "plan",
  "build_mvp",
  "generate_assets",
  "validate",
  "export"
]);

export type JobType = z.infer<typeof JobTypeSchema>;

export const JobStatusSchema = z.enum(["queued", "running", "succeeded", "failed"]);

export type JobStatus = z.infer<typeof JobStatusSchema>;

// ---------- API Request/Response Schemas ----------

export const CreateProjectRequestSchema = z.object({
  wizard: WizardPayloadSchema
});

export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

export const CreateProjectResponseSchema = z.object({
  projectId: z.string().uuid(),
  jobId: z.string().uuid()
});

export type CreateProjectResponse = z.infer<typeof CreateProjectResponseSchema>;

// ---------- Job Payload Schema ----------

export const JobPayloadSchema = z.object({
  wizard: WizardPayloadSchema.optional(),
  results: z.array(z.unknown()).optional(),
  artifact_bucket: z.string().optional(),
  artifact_object_path: z.string().optional()
});

export type JobPayload = z.infer<typeof JobPayloadSchema>;

// ---------- Project Schema (from DB) ----------

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  name: z.string(),
  created_at: z.string()
});

export type Project = z.infer<typeof ProjectSchema>;

// ---------- Job Schema (from DB) ----------

export const JobSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  type: JobTypeSchema,
  status: JobStatusSchema,
  payload: z.record(z.unknown()),
  error: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string()
});

export type Job = z.infer<typeof JobSchema>;

// ---------- Auth ----------

export const UserSessionSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  role: z.enum(["user", "admin"]).default("user")
});

export type UserSession = z.infer<typeof UserSessionSchema>;

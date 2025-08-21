// api/src/utils/schema.util.ts
import { z } from "zod";

/** Structured documentation schema (for JSON-mode generations) */
export const DocumentationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  sections: z.array(
    z.object({
      heading: z.string().min(1),
      content: z.string().min(1),
    })
  ).default([]),
});
export type Documentation = z.infer<typeof DocumentationSchema>;

/** GitHub repo metadata schema */
export const RepoMetadataSchema = z.object({
  name: z.string(),
  fullName: z.string(),
  url: z.string().url(),
  defaultBranch: z.string().default("main"),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stars: z.number().nonnegative(),
  forks: z.number().nonnegative(),
});
export type RepoMetadata = z.infer<typeof RepoMetadataSchema>;

/** Zod validator helper */
export function validateSchema<T>(schema: z.ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      "Schema validation failed: " +
      JSON.stringify(parsed.error.format(), null, 2)
    );
  }
  return parsed.data;
}

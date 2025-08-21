import { z } from "zod";

export const CreateMeetingSchema = z.object({
  topic: z.string().optional(),
  description: z.string().optional(),
  invites: z
    .array(
      z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address")
    )
    .min(1, "At least one invite is required"),
  dateTime: z.date(),
  link: z.string().optional(),
});

export type CreateMeetingSchemaType = z.infer<typeof CreateMeetingSchema>;

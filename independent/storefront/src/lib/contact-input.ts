import { z } from "zod";
export const contactSubjects = ["Product question", "Order enquiry", "General enquiry", "Other"] as const;
export const contactInput = z.object({
  name: z.string().trim().min(2, "Enter your name (at least 2 characters).").max(100, "Use 100 characters or fewer.").regex(/^[^\r\n]+$/, "Enter your name on one line."),
  email: z.email("Enter a valid email address.").max(254),
  subject: z.enum(contactSubjects, { error: "Choose a subject." }),
  message: z.string().trim().min(10, "Add a little more detail (at least 10 characters).").max(4000, "Use 4,000 characters or fewer."),
  website: z.string().max(200).default(""),
  token: z.string().max(250),
}).strict();
export type ContactInput = z.infer<typeof contactInput>;

import { z } from "zod";

/** Schema for the complete signup / user information form. */
export const signupFormSchema = z.object({
  pendingToken: z.string().min(1, "Signup token is required"),
  alias: z.string().trim().min(1, "Alias is required"),
  name: z.string().trim().min(1, "Name is required"),
  dateOfBirth: z.string().optional(),
  gender: z
    .union([z.enum(["male", "female", "other"]), z.literal("")])
    .optional(),
});

export type SignupFormValues = z.infer<typeof signupFormSchema>;

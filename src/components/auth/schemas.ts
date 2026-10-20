import { z } from "zod";

/** The same rules as the server: a nickname for sign-up, a valid email, a password of at least 8 characters. */
export const emailSchema = z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address.");
export const passwordSchema = z.string().min(8, "Use at least 8 characters.");
export const nicknameSchema = z.string().trim().min(1, "Pick a nickname.").max(40, "Use at most 40 characters.");

export const signInSchema = z.object({ email: emailSchema, password: passwordSchema });
export const signUpSchema = signInSchema.extend({ nickname: nicknameSchema });

export type AuthField = "nickname" | "email" | "password";
export type AuthErrors = Partial<Record<AuthField, string>>;

/** Checks the form and returns one message per invalid field. An empty object means the form is valid. */
export function validateAuth(mode: "signin" | "signup", values: { nickname: string; email: string; password: string }): AuthErrors {
  const result = (mode === "signup" ? signUpSchema : signInSchema).safeParse(values);
  if (result.success) return {};
  const errors: AuthErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as AuthField;
    errors[field] ??= issue.message;
  }
  return errors;
}

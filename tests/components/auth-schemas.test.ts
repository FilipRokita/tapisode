import { describe, expect, it } from "vitest";
import { validateAuth } from "@/components/auth/schemas";

const good = { nickname: "Ada", email: "ada@example.com", password: "12345678" };

describe("validateAuth", () => {
  it("accepts a valid sign-up and a valid sign-in", () => {
    expect(validateAuth("signup", good)).toEqual({});
    expect(validateAuth("signin", { ...good, nickname: "" })).toEqual({});
  });

  it("asks for all three fields on an empty sign-up", () => {
    expect(validateAuth("signup", { nickname: "", email: "", password: "" })).toEqual({
      nickname: "Pick a nickname.",
      email: "Enter a valid email address.",
      password: "Use at least 8 characters.",
    });
  });

  it("does not ask for a nickname on sign-in", () => {
    expect(validateAuth("signin", { nickname: "", email: "", password: "" })).toEqual({
      email: "Enter a valid email address.",
      password: "Use at least 8 characters.",
    });
  });

  it("rejects an invalid email and a short password", () => {
    expect(validateAuth("signin", { ...good, email: "nope" }).email).toBe("Enter a valid email address.");
    expect(validateAuth("signin", { ...good, password: "short" }).password).toBe("Use at least 8 characters.");
  });
});

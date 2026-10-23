import { afterEach, describe, expect, it, vi } from "vitest";

const saved = { ...process.env };

async function load() {
  vi.resetModules();
  return (await import("@/config/env")).getEnv;
}

afterEach(() => {
  process.env = { ...saved };
});

describe("legal details", () => {
  it("are read from the environment", async () => {
    const env = (await load())();
    expect(env.LEGAL_CONTROLLER_NAME).toBe("Test Controller");
    expect(env.LEGAL_CONTACT_EMAIL).toBe("legal@example.test");
  });

  it("stop the app when the name is missing", async () => {
    delete process.env.LEGAL_CONTROLLER_NAME;
    expect((await load())).toThrow(/LEGAL_CONTROLLER_NAME/);
  });

  it("stop the app when the contact is not an email", async () => {
    process.env.LEGAL_CONTACT_EMAIL = "not-an-email";
    expect((await load())).toThrow(/LEGAL_CONTACT_EMAIL/);
  });
});

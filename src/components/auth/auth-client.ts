"use client";

import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Sign-in, sign-up, sign-out and the sandbox all go through this client, which calls Better Auth's HTTP handler. Calling
 * `auth.api` from a Server Action instead would skip the rate limiter.
 */
export const authClient = createAuthClient({ plugins: [anonymousClient()] });

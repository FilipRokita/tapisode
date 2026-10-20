"use client";

import { cn } from "cn";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock } from "@/components/primitives/icons";
import { Logo } from "@/components/primitives/logo";
import { Segmented } from "@/components/primitives/segmented";
import { prefersReducedMotion } from "@/components/primitives/use-reduced-motion";
import { authClient } from "./auth-client";
import { validateAuth, type AuthErrors, type AuthField } from "./schemas";

type Mode = "signin" | "signup";

const HEADS: Record<Mode, { title: string; sub: string }> = {
  signin: { title: "Welcome back", sub: "Sign in to pick up where you left off." },
  signup: { title: "Create your account", sub: "One account for every list you will ever keep." },
};

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

/** Turns what Better Auth answered into a sentence for the form. */
function formMessage(error: { status?: number; code?: string; message?: string }): { text: string; full?: boolean } {
  if (error.status === 429) return { text: "Too many attempts. Wait a moment." };
  if (error.status === 503 || error.message === "SANDBOX_FULL") return { text: "The demo is full right now. Try again later, or create an account.", full: true };
  if (error.code?.includes("USER_ALREADY_EXISTS")) return { text: "That email is already registered. Sign in instead." };
  if (error.status === 401 || error.code === "INVALID_EMAIL_OR_PASSWORD") return { text: "Wrong email or password." };
  return { text: "Something went wrong. Try again." };
}

/** The heading slides out in the direction of the pill and the new one slides in from the other side. */
function Heading({ mode }: { mode: Mode }) {
  const [shown, setShown] = useState(mode);
  const node = useRef<HTMLDivElement>(null);
  const settled = useRef(true);

  useEffect(() => {
    if (shown === mode) return;
    const still = prefersReducedMotion();
    if (!still) {
      const dx = mode === "signup" ? -28 : 28;
      node.current?.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${dx}px)` }], { duration: 160, easing: "ease", fill: "forwards" });
    }
    const timer = setTimeout(() => {
      settled.current = false;
      setShown(mode);
    }, still ? 0 : 160);
    return () => clearTimeout(timer);
  }, [mode, shown]);

  useEffect(() => {
    if (settled.current) return;
    settled.current = true;
    const el = node.current;
    el?.getAnimations().forEach((a) => a.cancel());
    if (prefersReducedMotion()) return;
    const dx = shown === "signup" ? 28 : -28;
    el?.animate([{ opacity: 0, transform: `translateX(${dx}px)` }, { opacity: 1, transform: "none" }], { duration: 340, easing: EASE });
  }, [shown]);

  return (
    <div ref={node} className="mt-7 min-h-16">
      <h1 className="mb-1.5 text-[28px] font-extrabold tracking-[-0.035em]">{HEADS[shown].title}</h1>
      <p className="text-[14.5px] text-dim">{HEADS[shown].sub}</p>
    </div>
  );
}

/** Extra fields fold away instead of re-rendering, so the form never jumps. */
function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      inert={!open}
      className={cn(
        "grid ease-app",
        // Hidden only after it has folded away, so it is also gone for assistive tech and tests.
        open
          ? "visible grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity,visibility] duration-[360ms]"
          : "invisible grid-rows-[0fr] opacity-0 [transition:grid-template-rows_360ms_var(--ease),opacity_260ms_ease,visibility_0s_linear_360ms]",
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mt-3.5 grid gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-dim">
        {label}
      </label>
      {children}
      <p id={`${id}-error`} className="text-[12.5px] text-danger empty:hidden">
        {error}
      </p>
    </div>
  );
}

export function AuthScreen({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [values, setValues] = useState({ nickname: "", email: "", password: "" });
  const [errors, setErrors] = useState<AuthErrors>({});
  const [busy, setBusy] = useState<"form" | "sandbox" | null>(null);
  const [failure, setFailure] = useState<{ text: string; full?: boolean } | null>(null);
  const signUp = mode === "signup";

  const switchMode = (next: Mode) => {
    setMode(next);
    setFailure(null);
    window.history.replaceState(null, "", next === "signup" ? "/signup" : "/signin");
  };

  const edit = (field: AuthField, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const enter = () => {
    router.push("/app/watching");
    router.refresh();
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateAuth(mode, values);
    setErrors(found);
    setFailure(null);
    const first = (["nickname", "email", "password"] as const).find((f) => found[f] && (f !== "nickname" || signUp));
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    setBusy("form");
    const { error } = signUp
      ? await authClient.signUp.email({ email: values.email.trim(), password: values.password, name: values.nickname.trim() })
      : await authClient.signIn.email({ email: values.email.trim(), password: values.password });
    if (error) {
      setBusy(null);
      setFailure(formMessage(error));
      return;
    }
    enter();
  }

  async function trySandbox() {
    setBusy("sandbox");
    setFailure(null);
    const { error } = await authClient.signIn.anonymous();
    if (error) {
      setBusy(null);
      setFailure(formMessage(error));
      return;
    }
    enter();
  }

  return (
    <main className="fade-in grid min-h-screen justify-items-center items-start px-5 pb-12 pt-[clamp(24px,calc(100vh-815px),12vh)]">
      <div className="w-full max-w-[400px]">
        <Link href="/" aria-label="Tapisode home">
          <Logo />
        </Link>
        <Heading mode={mode} />
        <Segmented
          kind="tab"
          label="Sign in or create an account"
          className="mt-[22px]"
          value={mode}
          onChange={switchMode}
          items={[
            { value: "signin", label: "Sign in" },
            { value: "signup", label: "Create account" },
          ]}
        />
        <form onSubmit={submit} noValidate>
          <Collapse open={signUp}>
            <Field id="nickname" label="Nickname" error={errors.nickname}>
              <Input id="nickname" autoComplete="nickname" placeholder="What should we call you?" value={values.nickname} onChange={(e) => edit("nickname", e.target.value)} aria-invalid={!!errors.nickname} aria-describedby="nickname-error" />
            </Field>
          </Collapse>
          <Field id="email" label="Email" error={errors.email}>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={values.email} onChange={(e) => edit("email", e.target.value)} aria-invalid={!!errors.email} aria-describedby="email-error" />
          </Field>
          <Field id="password" label="Password" error={errors.password}>
            <Input id="password" type="password" autoComplete={signUp ? "new-password" : "current-password"} placeholder="At least 8 characters" value={values.password} onChange={(e) => edit("password", e.target.value)} aria-invalid={!!errors.password} aria-describedby="password-error" />
          </Field>
          <Collapse open={signUp}>
            <div className="mt-4 flex gap-2.5 rounded-[14px] border border-border bg-surface p-3 text-[13.5px] text-dim">
              <Clock className="mt-0.5 size-5 shrink-0" />
              <span>This is a demo project. Please use a throwaway email address. You must be at least 16 to register.</span>
            </div>
          </Collapse>
          {failure && (
            <p role="alert" className="mt-4 text-[13.5px] text-danger">
              {failure.text}{" "}
              {failure.full && (
                <Link href="/signup" className="underline">
                  Create an account
                </Link>
              )}
            </p>
          )}
          <Button type="submit" variant="primary" size="lg" className="mt-[18px] w-full" disabled={busy !== null} aria-busy={busy === "form"}>
            {busy === "form" && <span className="size-4 animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />}
            {busy === "form" ? (signUp ? "Creating account…" : "Signing in…") : signUp ? "Create account" : "Sign in"}
          </Button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.08em] text-faint before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">or</div>
        <Button type="button" size="lg" className="w-full" onClick={trySandbox} disabled={busy !== null}>
          {busy === "sandbox" ? "Opening the demo…" : "Try without an account"}
        </Button>
        <p className="mt-[18px] text-[13px] text-dim">
          By continuing you agree to the{" "}
          <Link href="/terms" className="underline">
            terms
          </Link>{" "}
          and the{" "}
          <Link href="/privacy" className="underline">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

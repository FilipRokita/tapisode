"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { authClient } from "@/components/auth/auth-client";
import { passwordSchema } from "@/components/auth/schemas";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string }>({});
  const [busy, setBusy] = useState(false);

  const close = (value: boolean) => {
    if (!value) {
      setCurrent("");
      setNext("");
      setErrors({});
    }
    onOpenChange(value);
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found: typeof errors = {};
    if (!current) found.current = "Enter your current password.";
    const parsed = passwordSchema.safeParse(next);
    if (!parsed.success) found.next = parsed.error.issues[0]?.message;
    setErrors(found);
    if (found.current || found.next) return;
    setBusy(true);
    const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
    setBusy(false);
    if (error) {
      setErrors(error.status === 429 ? { current: "Too many attempts. Wait a moment." } : { current: "Current password is wrong." });
      return;
    }
    close(false);
    toast("Password updated");
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>Other devices will be signed out.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="grid gap-3.5">
          <div className="grid gap-1.5">
            <label htmlFor="current-password" className="text-[13px] font-semibold text-dim">
              Current password
            </label>
            <Input id="current-password" type="password" autoComplete="current-password" value={current} onChange={(e) => { setCurrent(e.target.value); setErrors((x) => ({ ...x, current: undefined })); }} aria-invalid={!!errors.current} aria-describedby="current-password-error" />
            <p id="current-password-error" className="text-[12.5px] text-danger empty:hidden">{errors.current}</p>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="new-password" className="text-[13px] font-semibold text-dim">
              New password
            </label>
            <Input id="new-password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={next} onChange={(e) => { setNext(e.target.value); setErrors((x) => ({ ...x, next: undefined })); }} aria-invalid={!!errors.next} aria-describedby="new-password-error" />
            <p id="new-password-error" className="text-[12.5px] text-danger empty:hidden">{errors.next}</p>
          </div>
          <Button type="submit" variant="primary" className="mt-1.5 w-full" disabled={busy}>
            {busy ? "Updating…" : "Update password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

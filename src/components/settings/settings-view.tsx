"use client";

import { setSessionHint } from "@/components/landing/session-hint";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setCountry } from "@/actions/account";
import { authClient } from "@/components/auth/auth-client";
import { PageHeader } from "@/components/app-shell/page-header";
import { errorMessage } from "@/components/copy";
import { TmdbAttribution } from "@/components/legal/tmdb-attribution";
import { ChevronRight, Download, LogOut, Trash2 } from "@/components/primitives/icons";
import { Button } from "@/components/ui/button";
import type { Region } from "@/domain/provider";
import { ChangePasswordDialog } from "./change-password-dialog";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";

function Row({ title, hint, children, className }: { title: string; hint?: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={`flex min-h-14 items-center justify-between gap-3 border-t border-border px-4 py-3.5 first:border-t-0 ${className ?? ""}`}>
      <div className="min-w-0">
        <b className="font-semibold">{title}</b>
        {hint && <small className="block text-[12.5px] text-faint">{hint}</small>}
      </div>
      {children}
    </div>
  );
}

const List = ({ children }: { children: React.ReactNode }) => <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface">{children}</div>;
const SectionHead = ({ children }: { children: React.ReactNode }) => <h2 className="mt-[26px] mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-faint">{children}</h2>;

interface SettingsViewProps {
  readonly isSandbox: boolean;
  readonly country: string;
  readonly regions: readonly Region[];
}

export function SettingsView({ isSandbox, country, regions }: SettingsViewProps) {
  const router = useRouter();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [, startTransition] = useTransition();
  // The select shows the chosen value at once and the server catches up.
  const [chosen, setChosen] = useState(country);
  const options = regions.some((r) => r.code === chosen) ? regions : [{ code: chosen, name: chosen }, ...regions];

  function changeCountry(next: string) {
    setChosen(next);
    startTransition(async () => {
      const result = await setCountry({ country: next });
      if (!result.ok) {
        setChosen(country);
        toast(errorMessage(result.error));
        return;
      }
      toast(`Country set to ${next}. Availability is loading.`);
      router.refresh();
    });
  }

  async function signOut() {
    await authClient.signOut().catch(() => {});
    setSessionHint(false);
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <PageHeader title="Settings" sub="Account and preferences" />
      <List>
        {isSandbox ? (
          <Row title="Create account" hint="Keep your lists. Takes a minute.">
            <Button asChild variant="primary" className="min-h-11 md:min-h-10">
              <Link href="/signup">Create account</Link>
            </Button>
          </Row>
        ) : (
          <Row title="Password" hint="Change the password you sign in with">
            <Button variant="secondary" className="needs-net min-h-11 md:min-h-10" onClick={() => setPasswordOpen(true)}>
              Change password
            </Button>
          </Row>
        )}
        <Row title="Country" hint="Sets which services you can filter by">
          <select
            aria-label="Country"
            value={chosen}
            onChange={(e) => changeCountry(e.target.value)}
            className="needs-net h-11 md:h-10 max-w-[180px] rounded-[12px] border border-border bg-surface-2 px-2.5"
          >
            {options.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </Row>
      </List>
      <SectionHead>Your data</SectionHead>
      <List>
        <Row title="Export my data" hint="Download everything as a JSON file">
          <Button asChild variant="secondary" className="needs-net min-h-11 md:min-h-10">
            <a href="/api/export" download="tapisode-export.json" onClick={() => toast("Your data was exported as tapisode-export.json")}>
              <Download />
              Export
            </a>
          </Button>
        </Row>
        <Row title="Delete account" hint="Removes your account and all your lists">
          <Button variant="danger" className="needs-net min-h-11 md:min-h-10" onClick={() => setDeleteOpen(true)}>
            <Trash2 />
            Delete
          </Button>
        </Row>
      </List>
      <SectionHead>About</SectionHead>
      <List>
        {[
          ["Privacy policy", "/privacy"],
          ["Terms", "/terms"],
        ].map(([label, href]) => (
          <Link key={href} href={href!} className="flex min-h-14 items-center justify-between border-t border-border px-4 first:border-t-0 hover:bg-surface-2">
            {label}
            <ChevronRight className="size-5 text-faint" />
          </Link>
        ))}
        <div className="border-t border-border px-4 py-3.5">
          <TmdbAttribution className="text-[12.5px] text-faint" />
        </div>
      </List>
      <div className="mt-[18px]">
        <Button variant="ghost" onClick={signOut}>
          <LogOut />
          Sign out
        </Button>
      </div>
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
      <ConfirmDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}

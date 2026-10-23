import type { Metadata } from "next";
import { loadLibrary, regionOf, requirePageUser, sandboxHoursLeft } from "@/actions/queries/library";
import { AppShell, type ShellUser } from "@/components/app-shell/app-shell";
import { SessionMark } from "@/components/landing/session-probe";
import { LibraryProvider } from "@/components/library/library-provider";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  const { titles, pending } = await loadLibrary(user);
  const shellUser: ShellUser = user.isSandbox
    ? { name: "Demo visitor", caption: `Demo, expires in ${sandboxHoursLeft(user)} h`, initial: "D" }
    : { name: user.name, caption: user.email, initial: (user.name[0] ?? "?").toUpperCase() };
  return (
    <LibraryProvider initial={titles} pending={pending}>
      <SessionMark />
      <AppShell user={shellUser} region={regionOf(user)}>{children}</AppShell>
    </LibraryProvider>
  );
}

import { loadLibrary, requirePageUser, sandboxHoursLeft } from "@/actions/queries/library";
import { AppShell, type ShellUser } from "@/components/app-shell/app-shell";
import { LibraryProvider } from "@/components/library/library-provider";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  const { titles } = await loadLibrary(user);
  const shellUser: ShellUser = user.isSandbox
    ? { name: "Demo visitor", caption: `Demo, expires in ${sandboxHoursLeft(user)} h`, initial: "D" }
    : { name: user.name, caption: user.email, initial: (user.name[0] ?? "?").toUpperCase() };
  return (
    <LibraryProvider initial={titles}>
      <AppShell user={shellUser}>{children}</AppShell>
    </LibraryProvider>
  );
}

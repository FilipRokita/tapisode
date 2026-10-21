import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPageUser } from "@/actions/queries/library";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = { title: "Sign in · Tapisode", robots: { index: false } };

export default async function SignInPage() {
  const user = await getPageUser();
  // A demo visitor may land here to turn the session into an account, so only a real account is sent away.
  if (user && !user.isSandbox) redirect("/app/watching");
  return <AuthScreen initialMode="signin" />;
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPageUser } from "@/actions/queries/library";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = { title: "Create account · Tapisode", robots: { index: false } };

export default async function SignUpPage() {
  if (await getPageUser()) redirect("/app/watching");
  return <AuthScreen initialMode="signup" />;
}

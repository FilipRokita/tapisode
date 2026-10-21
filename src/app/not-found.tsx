import Link from "next/link";
import { Logo } from "@/components/primitives/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div className="grid justify-items-center gap-5">
        <Logo />
        <div className="rise-in grid justify-items-center gap-5">
          <h1 className="text-[28px] font-extrabold tracking-[-0.035em]">This page could not be found.</h1>
          <Button asChild variant="primary" size="lg">
            <Link href="/">Back to Tapisode</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

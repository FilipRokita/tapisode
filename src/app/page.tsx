import { loadDemo } from "@/actions/queries/demo";
import { ConfettiHost } from "@/components/confetti-host";
import { Atmosphere } from "@/components/landing/atmosphere";
import { Closing } from "@/components/landing/closing";
import { Features } from "@/components/landing/features";
import { LandingFooter } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { LandingNav } from "@/components/landing/nav";
import { Steps } from "@/components/landing/steps";

// No cookies, no headers, no database: the demo's data is built from the fake provider, so this page is built once.
export default async function Landing() {
  const demo = await loadDemo();
  return (
    <div className="relative overflow-hidden">
      <Atmosphere />
      <div className="relative mx-auto max-w-[1120px] px-5">
        <LandingNav />
        <Hero demo={demo} />
        <Features />
        <Steps />
        <Closing />
        <LandingFooter />
      </div>
      <ConfettiHost />
    </div>
  );
}

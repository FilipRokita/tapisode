import type { Metadata } from "next";
import { LEGAL_UPDATED, LegalPage } from "@/components/legal/legal-page";
import { getEnv } from "@/config/env";

export const metadata: Metadata = {
  title: "Privacy policy · Tapisode",
  description: "What Tapisode keeps about you, why, who processes it and how to use your rights.",
};

export default function PrivacyPage() {
  const { LEGAL_CONTROLLER_NAME: controller, LEGAL_CONTACT_EMAIL: contact } = getEnv();
  return (
    <LegalPage title="Privacy policy" updated={LEGAL_UPDATED}>
      <p>This is a short, plain-language summary of how Tapisode treats your data. Tapisode is a non-commercial learning and portfolio project.</p>
      <h2>Who is responsible</h2>
      <p>{controller}, the person who runs this project. Contact: {contact}.</p>
      <h2>What we keep</h2>
      <ul>
        <li>Your email, nickname and a hashed password.</li>
        <li>Your country and your lists of titles with your progress.</li>
        <li>A session cookie that keeps you signed in. It is strictly necessary, so there is no cookie banner.</li>
        <li>Your IP address, only briefly, to limit abuse and to guess your country when you sign up.</li>
      </ul>
      <h2>Why and on what basis</h2>
      <p>To run your account and the service you asked for (contract), and to keep the service safe (legitimate interest).</p>
      <h2>Who processes it</h2>
      <p>
        Vercel hosts the app and Neon hosts the database, both possibly outside the EU under standard safeguards. Posters are loaded straight from TMDB&apos;s servers, <b className="text-foreground">so TMDB can see your IP address</b>. Fonts are served from this site.
      </p>
      <h2>How long</h2>
      <p>Until you delete your account. Temporary demo sessions expire after 6 hours.</p>
      <h2>Your rights</h2>
      <p>
        You can access, correct, delete and export your data, and complain to the Polish supervisory authority (UODO). Deleting your account and exporting your data are in Settings. For anything else, write to {contact} and you will get an answer within one month.
      </p>
    </LegalPage>
  );
}

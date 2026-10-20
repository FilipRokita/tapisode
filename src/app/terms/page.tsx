import type { Metadata } from "next";
import { LEGAL_UPDATED, LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms · Tapisode",
  description: "The terms of using Tapisode, a free, non-commercial learning and portfolio project.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms" updated={LEGAL_UPDATED}>
      <p>Tapisode is a free, non-commercial learning and portfolio project, provided as is, without any warranty.</p>
      <h2>Using the service</h2>
      <ul>
        <li>You must be at least 16 to register.</li>
        <li>Do not abuse the service or try to overload it or the data provider behind it.</li>
        <li>Accounts that abuse the service may be closed.</li>
      </ul>
      <h2>Your data</h2>
      <p>You can delete your account and export your data at any time in Settings.</p>
      <h2>Credits</h2>
      <p>This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability data by JustWatch.</p>
    </LegalPage>
  );
}

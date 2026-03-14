import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "KUMIKOJEM — Find Your Job in Japan",
  description: "Top-matched jobs in Japan with housing support for Filipino workers",
};

export default function TalentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}

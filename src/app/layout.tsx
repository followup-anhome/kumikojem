import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KUMIKOJEM",
  description: "フィリピン人材 × 日本企業マッチングプラットフォーム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

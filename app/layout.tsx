import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SyncFit Edge",
  description: "Adaptive female training prescription and injury prevention.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";

import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "SyncFit Edge", template: "%s · SyncFit Edge" },
  description: "Adaptive female training prescription and injury prevention.",
};

export const viewport: Viewport = {
  themeColor: "#f1ccde",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";

import { SharedScreen } from "./SharedScreen";

export const metadata: Metadata = { title: "Perfil compartido", robots: { index: false, follow: false } };

/**
 * Static export cannot know share tokens at build time, so a single placeholder
 * page is generated. The host rewrites /compartido/<token>/ to it and
 * SharedScreen reads the real token from the URL.
 */
export function generateStaticParams() {
  return [{ token: "_" }];
}

export default function CompartidoPage() {
  return <SharedScreen />;
}

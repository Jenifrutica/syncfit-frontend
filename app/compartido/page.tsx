import type { Metadata } from "next";

import { SharedScreen } from "./SharedScreen";

export const metadata: Metadata = { title: "Perfil compartido", robots: { index: false, follow: false } };

/**
 * Static export cannot know share tokens at build time, so the link carries the
 * token as a query string (`/compartido/?token=...`) and the client reads it.
 * The old `/compartido/<token>/` path was a dynamic route and returned 500 in
 * the static export.
 */
export default function CompartidoPage() {
  return <SharedScreen />;
}

import type { Metadata } from "next";

import { SharedScreen } from "./SharedScreen";

export const metadata: Metadata = { title: "Perfil compartido", robots: { index: false, follow: false } };

export default async function CompartidoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SharedScreen token={token} />;
}

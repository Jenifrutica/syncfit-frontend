import { redirect } from "next/navigation";

/** Links created before the redesign keep working. */
export default async function LegacySharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  redirect(`/compartido/${encodeURIComponent(token)}`);
}

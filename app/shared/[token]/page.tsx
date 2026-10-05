import { LegacyRedirect } from "./LegacyRedirect";

/** Single placeholder page for the static export; the host rewrites /shared/<token>/ to it. */
export function generateStaticParams() {
  return [{ token: "_" }];
}

export default function LegacySharedPage() {
  return <LegacyRedirect />;
}

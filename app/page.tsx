import { LandingScreen } from "@/components/landing/LandingScreen";

/** Public landing. Signed-in people get an "Open my app" button instead of a redirect. */
export default function RootPage() {
  return <LandingScreen />;
}

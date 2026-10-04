import type { Metadata } from "next";

import { Showcase } from "./Showcase";

export const metadata: Metadata = {
  title: "Sistema de diseño",
  robots: { index: false, follow: false },
};

/** Living reference of the design system (see DESIGN_SYSTEM.md). */
export default function DesignSystemPage() {
  return <Showcase />;
}

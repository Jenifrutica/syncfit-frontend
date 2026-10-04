import type { PulsiMood } from "@/components/mascot/Pulsi";

/**
 * Pulsi's face from the backend decision. Alerts win (something to read),
 * then high fatigue, then the load multiplier.
 */
export function moodFromDecision(input: {
  fatigueLevel?: string | null;
  kLoad?: number | null;
  hasAlerts?: boolean;
}): PulsiMood {
  if (input.hasAlerts) return "alerta";
  if (input.fatigueLevel === "HIGH") return "cansada";
  if (typeof input.kLoad === "number" && input.kLoad < 0.85) return "cansada";
  return "feliz";
}

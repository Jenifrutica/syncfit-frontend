/** Minimal API client for the SyncFit Edge backend. */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/api/v1/ws/telemetry";

export interface Decision {
  phase_inferred: string;
  fatigue_level: string;
  k_load_multiplier: number;
  rmssd_hrv_ms: number;
}

export interface TelemetryFrame {
  schema_version: string;
  device_id: string;
  session_id: string;
  timestamp: string;
  modality: "MENSTRUAL_CYCLE" | "GESTATIONAL";
  day_or_week: number;
  biomarkers: {
    delta_temperature_c: number;
    rmssd_hrv_ms: number;
    isometric_force_loss_pct: number;
  };
  ppg_window: { sample_rate_hz: number; window_size: number; samples: number[] };
}

export const SAMPLE_FRAME: TelemetryFrame = {
  schema_version: "1.0.0",
  device_id: "frontend-demo",
  session_id: "3f1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  timestamp: "2026-09-21T13:24:05Z",
  modality: "MENSTRUAL_CYCLE",
  day_or_week: 14,
  biomarkers: {
    delta_temperature_c: 0.42,
    rmssd_hrv_ms: 28.5,
    isometric_force_loss_pct: 12.8,
  },
  ppg_window: {
    sample_rate_hz: 100,
    window_size: 8,
    samples: [0.1, 0.2, -0.1, 0.3, 0.0, -0.2, 0.15, 0.05],
  },
};

export async function getHealth(): Promise<{ status: string; version: string }> {
  const response = await fetch(`${API_URL}/api/v1/health`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`health check failed: ${response.status}`);
  }
  return response.json();
}

export async function sendTelemetry(frame: TelemetryFrame): Promise<Decision> {
  const response = await fetch(`${API_URL}/api/v1/telemetry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(frame),
  });
  if (!response.ok) {
    throw new Error(`telemetry failed: ${response.status}`);
  }
  const data = (await response.json()) as { decision: Decision };
  return data.decision;
}

"use client";

import { useState } from "react";

import { Decision, SAMPLE_FRAME, getHealth, sendTelemetry } from "@/lib/api";

export default function HomePage() {
  const [health, setHealth] = useState<string>("not checked");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkHealth() {
    setError(null);
    try {
      const result = await getHealth();
      setHealth(`${result.status} (v${result.version})`);
    } catch (err) {
      setHealth("unreachable");
      setError((err as Error).message);
    }
  }

  async function runSample() {
    setError(null);
    try {
      setDecision(await sendTelemetry(SAMPLE_FRAME));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold text-slate-800">SyncFit Edge</h1>
      <p className="mt-2 text-slate-600">
        Minimal interface to verify the backend flow.
      </p>

      <section className="mt-6 flex gap-3">
        <button
          onClick={checkHealth}
          className="rounded bg-slate-700 px-4 py-2 text-white hover:bg-slate-800"
        >
          Check backend health
        </button>
        <button
          onClick={runSample}
          className="rounded bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
        >
          Send sample telemetry
        </button>
      </section>

      <p className="mt-4 text-sm text-slate-500">Health: {health}</p>

      {decision && (
        <pre className="mt-4 overflow-auto rounded bg-slate-900 p-4 text-sm text-teal-200">
          {JSON.stringify(decision, null, 2)}
        </pre>
      )}

      {error && <p className="mt-4 text-sm text-red-600">Error: {error}</p>}
    </main>
  );
}

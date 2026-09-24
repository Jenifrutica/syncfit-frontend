"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { API_URL, SharedProfile, getShared } from "@/lib/api";
import { Dumbbell, Flame, Flower, Heart, Leaf } from "@/components/icons";

export default function SharedProfilePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token as string;
  const [shared, setShared] = useState<SharedProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getShared(token).then(setShared).catch((err) => setError((err as Error).message));
  }, [token]);

  if (error) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-pink-600"><Flower size={24} /> SyncFit Edge</h1>
        <p className="mt-4 text-rose-600">{error}</p>
      </main>
    );
  }
  if (!shared) return <main className="p-8 text-pink-400"><Flower size={24} /></main>;

  const profile = (shared.profile ?? {}) as Record<string, unknown>;
  const timeline = (shared.timeline ?? {}) as Record<string, unknown>;
  const progress = (profile.progress ?? {}) as Record<string, unknown>;
  const routine = shared.routine as { items?: Record<string, unknown>[]; total_estimated_minutes?: number } | null;

  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="flex items-center gap-3">
        {shared.owner_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shared.owner_photo_url} alt="owner" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-pink-400"><Flower size={26} /></span>
        )}
        <div>
          <p className="text-xs uppercase tracking-wide text-pink-400">Shared profile</p>
          <h1 className="text-2xl font-bold text-pink-700">{shared.owner_display_name}</h1>
          <p className="text-sm text-slate-500">{shared.role} · read only</p>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {shared.permissions.map((p) => (
          <span key={p} className="rounded-full bg-pink-100 px-3 py-1 text-pink-700">{p}</span>
        ))}
      </div>

      {Boolean(timeline.phase) && (
        <section className="mt-5 rounded-2xl border border-pink-100 bg-white p-4">
          <h2 className="flex items-center gap-2 font-semibold text-pink-700"><Heart size={18} /> Today</h2>
          <p className="text-sm text-slate-700">
            {timeline.week ? `${timeline.week} weeks` : `Day ${timeline.cycle_day} · ${timeline.phase}`}
          </p>
        </section>
      )}

      {progress.streak_days !== undefined && (
        <section className="mt-4 rounded-2xl border border-pink-100 bg-white p-4">
          <h2 className="flex items-center gap-2 font-semibold text-pink-700"><Flame size={18} /> Progress</h2>
          <p className="text-sm text-slate-700">Streak: {String(progress.streak_days)} · week {String(progress.week_training_days)}/{String(progress.weekly_goal)}</p>
        </section>
      )}

      {routine?.items && (
        <section className="mt-4 rounded-2xl border border-pink-100 bg-white p-4">
          <h2 className="flex items-center gap-2 font-semibold text-pink-700"><Dumbbell size={18} /> Routine</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {routine.items.map((item, i) => (
              <li key={i} className="flex justify-between">
                <span>{String(item.name)}{item.blocked ? " (blocked)" : ""}</span>
                <span className="text-slate-500">{String(item.series)}×{String(item.reps)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {shared.loads && (
        <section className="mt-4 rounded-2xl border border-pink-100 bg-white p-4">
          <h2 className="flex items-center gap-2 font-semibold text-pink-700"><Dumbbell size={18} /> Usual loads</h2>
          <ul className="mt-2 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
            {shared.loads.map((load, i) => (
              <li key={i}>{String(load.exercise_id)}: {String(load.weight_kg)}</li>
            ))}
          </ul>
        </section>
      )}

      {shared.machines && (
        <section className="mt-4 rounded-2xl border border-pink-100 bg-white p-4">
          <h2 className="flex items-center gap-2 font-semibold text-pink-700"><Dumbbell size={18} /> Machines</h2>
          <p className="text-sm text-slate-700">{shared.machines.join(", ")}</p>
        </section>
      )}

      {shared.supplements && (
        <section className="mt-4 rounded-2xl border border-pink-100 bg-white p-4">
          <h2 className="flex items-center gap-2 font-semibold text-pink-700"><Leaf size={18} /> Supplements</h2>
          <p className="text-sm text-slate-700">{shared.supplements.map((s) => String(s.supplement_id)).join(", ")}</p>
        </section>
      )}

      <footer className="mt-6 text-center text-xs text-slate-400">Powered by SyncFit Edge · {API_URL}</footer>
    </main>
  );
}

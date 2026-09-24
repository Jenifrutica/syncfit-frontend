# SyncFit Frontend

Reactive analytical interface of SyncFit Edge for trainers and athletes. Built with TypeScript, Next.js, React and Tailwind CSS.

## Purpose

Make the adaptive prescription readable in real time: live waveforms, a dual-modality workflow, and a clear matrix of original versus adapted exercises.

## What belongs here

- **Dual-modality selector**: menstrual cycle or pregnancy, with the corresponding timeline.
- **Real-time visualization** (`components/viz/`): pulse wave and dynamometry rendered with HTML5 Canvas / D3.js.
- **Adaptive routine matrix**: original exercises, blocked exercises with reason, substitutes and adapted sets/reps/weight.
- **Telemetry client**: consumes the generated types and validators from [`syncfit-contracts`](../syncfit-contracts) and streams over WebSocket.
- Fully typed code, accessible components, responsive layout.

## What does NOT belong here

- Server logic, DSP, model training or AI prompts.

## Data Structures

| Structure | Complexity | Purpose |
|-----------|:----------:|---------|
| **Rolling Ring Buffer** | O(1) append | Fixed-length buffer feeding the real-time waveform canvas, keeping rendering smooth at high frequency. |

## Suggested structure

```
syncfit-frontend/
├── app/                # Next.js routes
├── components/
│   ├── viz/            # canvas / D3 real-time charts
│   └── routine/        # adaptive routine matrix
├── lib/                # WebSocket client, generated types
├── public/
├── package.json
└── README.md
```

## Stack

TypeScript, Next.js, React, Tailwind CSS, HTML5 Canvas, D3.js.

## Tasks

> **Language: TypeScript (mandatory).** The frontend is written in TypeScript with strict typing; no plain JavaScript files.

### Requirements

- [ ] Scaffold the Next.js + React + Tailwind CSS project in TypeScript.
- [ ] Implement the dual-modality selector (menstrual cycle / pregnancy).
- [ ] Implement the real-time pulse-wave visualization (HTML5 Canvas / D3.js).
- [ ] Implement the real-time dynamometry visualization.
- [ ] Implement the adaptive routine matrix (original, blocked, substitute, adapted sets/reps/weight).
- [ ] Implement the WebSocket client typed from `syncfit-contracts`.
- [ ] Consume the generated TypeScript types and Zod validators from `syncfit-contracts`.
- [ ] Implement the **Rolling Ring Buffer** for the real-time canvas.
- [ ] Ensure accessibility and responsive layout.
- [ ] Write component and end-to-end tests.
- [ ] Provide a Dockerfile consumable by `syncfit-infra`.

## Related repositories

- [`syncfit-contracts`](../syncfit-contracts) — generated types and WS protocol.
- [`syncfit-backend`](../syncfit-backend) — REST and WebSocket server.
- [`syncfit-simulator`](../syncfit-simulator) — mock telemetry during development.

All code, comments, documentation and commits in this repository are written in English.

## Context for a new session

**What it is.** Next.js (App Router) + TypeScript + Tailwind UI, pink theme.

**Run.** `npm install` then `npm run dev` (http://localhost:3000). API via
`NEXT_PUBLIC_API_URL` (default http://localhost:8000) and `NEXT_PUBLIC_WS_URL`.

**Layout.** `app/page.tsx` (main app: auth → if `role !== "ATHLETE"` render
`components/admin/AdminShell.tsx` only; otherwise onboarding → dashboard with
tabs Routine / Supplements / My machines / Profile), `app/shared/[token]/page.tsx`
(public read-only shared profile), `lib/api.ts` (client + token), `lib/i18n.ts`
(EN/ES/ZH), `components/icons.tsx` (SVG, no emoji),
`components/auth/AuthPanel.tsx`, `components/media/ExerciseMedia.tsx`,
`components/workout/WorkoutRunner.tsx`.

**Decoupled seams (work without context).**
- **Auth**: `components/auth/` (README there). Swap AuthPanel for OAuth/wizard.
- **Animations**: `components/media/` (README there). Populate `media_url` in the
  contracts catalog; no code change needed.

**Flows.** Login/signup (JWT in localStorage) → onboarding (modality, body comp,
goal, last period/cycle, machines, symptoms) → Routine: pick muscle groups,
exercise count, time budget, energy → "Tomar datos" → editable result →
"Iniciar rutina" (WorkoutRunner: stopwatch, rest countdown, per-set weight).
Supplements (current with editable macros + reminders, suggested with brands).
Profile (photo, machines, loads kg/lb, share links, calendar/streak/symptoms).

**Run checks.** `npm run typecheck` and `npm run build`.


## Admin UI (temporary) and roles

- After login the app reads `user.role`. Roles `SUPER_ADMIN`/`GYM_ADMIN` are
  **admin-only**: `app/page.tsx` returns `AdminShell` and they never get the
  athlete tabs, onboarding, cycle/gestational tracking or profile. Athletes see
  a **join gym by code** box in My machines.
- `components/admin/AdminPanel.tsx` (single screen for now): super admin creates
  gym admins; gym admin creates gyms, sees the code + QR and adds machines.
- **Temporary:** it is a single screen. README in `components/admin/` lists the
  improvements (split routes, real photo upload, edit/delete, audit log).
- Decoupled seams for later work without context: `components/auth/`,
  `components/media/`, `components/admin/`.

### Next steps for a fresh session (read this, then just do it)

1. **Split the admin screen into routes** — replace the temp single screen with
   `app/admin/layout.tsx` + `app/admin/super/page.tsx` (create/list gym admins,
   audit log) and `app/admin/gym/page.tsx` (own gyms, machines, QR). Keep
   `AdminShell.tsx` as the shared layout; `app/page.tsx` already early-returns it
   for `role !== "ATHLETE"`, so only the internals change.
2. **Real photo upload** for machines (presigned URL / S3) instead of a URL field.
3. **Edit/delete machines** + per-machine weight calibration, and pagination.
4. **Gym custom machines → routine weights**: `GET /api/v1/gyms/mine/machines`
   exists; wire the gym machine `weight_factor` into the load adjustment used in
   `components/workout/WorkoutRunner.tsx`.
5. **Admin tests** (frontend): role-gating (admin never sees athlete tabs) and
   the create-gym / add-machine flows.

Backend endpoints already available (no changes needed): `/api/v1/admin/gym-admins`
(GET/POST), `/api/v1/admin/me`, `/api/v1/admin/gyms`, `/api/v1/gyms` (create),
`/api/v1/gyms/mine`, `/api/v1/gyms/mine/machines`, `/api/v1/gyms/{id}/qr.png`,
`/api/v1/gyms/join`.

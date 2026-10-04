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
| **Set** | O(1) has | `training_dates` membership for the streak ring (`new Set(stats.training_dates)`). |
| **Hash map (Map)** | O(1) get | `joinedGymIndex` maps `gym_id → gym` so the joined-gym selector filters in O(1) instead of scanning. |
| **Grouped arrays** | O(G + M) | Joined gyms each carry their machines, so the UI renders per-gym groups with a name tag. |
| **Routine editor** | O(n) | "Take data" results are edited in place: swap an exercise via the catalog `select` (`replaceEntry`) or remove it (`removeEntry`). |
| **Localized machine text** | — | Gym machines store `name`/`purpose` as `{"en","es","zh"}` and are rendered with `localized(...)`; all UI strings go through `t(language, key)` (EN default). |
| **Live gym machines** | O(1) refetch | My Machines refreshes on window focus, on tab entry and every 15 s (plus a manual button), so admin edits appear without reload. |
| **Pattern + rationale** | — | The exercise modal shows the `movement_pattern` and the evidence-based `rationale` returned by the engine. |
| **Exercise detail modal** | — | Clicking a `RoutineCard` opens `ExerciseDetailModal`: animation placeholder, machine photo, estimated weight (`base × k_load × machine factor`), measured biomarkers, and swap/remove. Alternatives come from the movement family. |

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

TypeScript, Next.js 16, React 19, Tailwind CSS 4, Motion, Phosphor icons, HTML5 Canvas, D3.js.

## Design system

The UI is being redesigned (Paranice look, Flo usability, Headspace warmth):

- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — tokens, typography, components and rules.
- [`PRODUCT.md`](./PRODUCT.md) — users, purpose and product principles.
- [`FEATURES.md`](./FEATURES.md) — checklist so no existing feature is lost in the redesign.
- `npm run dev` → **`/ui`** shows every component live.

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

## Handoff for the team

**Role.** Next.js (App Router) + TypeScript + Tailwind UI. Consumes the backend
REST API; JWT in `localStorage`.

**Run / test.** `npm install` · `npm run dev` (http://localhost:3000) ·
`npm run typecheck` · `npm run build`.

**Entry points.** `lib/session.tsx` (session, role routing, language) and
`components/session/Guard.tsx`; routes `/entrar` (sign in / sign up),
`/bienvenida` (onboarding), `/app` (athlete), `/gym` and `/admin` (admins),
`/shared/[token]`; `lib/api.ts` (client + types), `lib/i18n.ts` + `lib/i18n-app.ts`
(ES default, EN, ZH); screens not yet redesigned live in `components/legacy/`.

**Recent features.** Super-admin users console; gym-admin equipment with
`equipment_key`; routine editor with **Change exercise** list
(`getExerciseAlternatives`); live gym-machine refresh; "Reasoned by DeepSeek"
badge; per-exercise detail modal.

## Context for a new session

**What it is.** Next.js (App Router) + TypeScript + Tailwind UI, pink theme.

**Run.** `npm install` then `npm run dev` (http://localhost:3000). API via
`NEXT_PUBLIC_API_URL` (default http://localhost:8000) and `NEXT_PUBLIC_WS_URL`.

**Layout.** `app/page.tsx` sends each person home (`homeFor`: athlete →
`/app` or `/bienvenida`, gym admin → `/gym`, super admin → `/admin`).
`/app` renders `components/legacy/LegacyAthleteApp.tsx` (tabs Routine /
Supplements / My machines / Profile) until phase 3 rebuilds it; `/gym` and
`/admin` render `components/admin/AdminShell.tsx` until phase 4.
`app/shared/[token]/page.tsx` is the public read-only shared profile.

**Decoupled seams (work without context).**
- **Auth**: `lib/session.tsx` (`signIn`, `signUp`, `signOut`) + `app/entrar/`.
  Server errors are mapped to friendly copy in `lib/auth-errors.ts`.
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
  **admin-only**: the route guards send them to `/admin` or `/gym` and they never
  get the athlete tabs, onboarding, cycle/gestational tracking or profile.
- **Athletes and gyms:** a **join gym by code** box in My machines. Joined gyms
  appear with the gym **name tag** on each machine; when there is more than one
  gym a **selector** filters the view, and each gym can be set **active** or left.
  Machines are read live from the backend (`GET /gyms/joined`), so admin edits
  show up automatically. See the `Map`/`Set` rows under **Data Structures**.
- `components/admin/AdminPanel.tsx` (single screen for now, i18n EN/ES/ZH): super
  admin creates gym admins; gym admin creates gyms, sees the code + QR and
  manages machines (list, add, edit, delete). Machine photos are uploaded files
  compressed client-side (`fileToDataUrl`) and stored as data URLs.
- **Temporary:** it is a single screen. README in `components/admin/` lists the
  improvements (split routes, object storage, audit log).
- Decoupled seams for later work without context: `lib/session.tsx`,
  `components/media/`, `components/admin/`.

### Next steps for a fresh session (read this, then just do it)

1. **Split the admin screen into routes** — replace the temp single screen with
   `app/admin/layout.tsx` + `app/admin/super/page.tsx` (create/list gym admins,
   audit log) and `app/admin/gym/page.tsx` (own gyms, machines, QR). Keep
   `AdminShell.tsx` as the shared layout; `app/page.tsx` already early-returns it
   for `role !== "ATHLETE"`, so only the internals change.
2. **Object storage for photos** (S3/presigned URLs). Today machine photos are
   uploaded files compressed client-side and stored as data URLs (see below).
3. **Reorder machines** + richer per-machine calibration, and pagination
   (add/edit/delete already done).
4. **Gym custom machines → routine weights**: machines are embedded in
   `GET /api/v1/gyms/mine`; wire the gym machine `weight_factor` into the load
   adjustment used in `components/workout/WorkoutRunner.tsx`.
5. **Admin tests** (frontend): role-gating (admin never sees athlete tabs) and
   the create-gym / add-machine flows.

Backend endpoints used by the admin UI: `/api/v1/admin/gym-admins` (GET/POST),
`/api/v1/admin/me`, `/api/v1/admin/gyms`, `/api/v1/gyms` (create),
`/api/v1/gyms/mine`, `POST/PATCH/DELETE /api/v1/gyms/{gym_id}/machines[/{machine_id}]`,
`/api/v1/gyms/{id}/qr.png`, `/api/v1/gyms/join`.

# Admin UI (temporary)

**Temporary single screen** for super admins and gym admins, mounted by
`AdminShell.tsx`. To be split into proper pages later (see notes below).

`AdminShell` is rendered by `app/page.tsx` as an **early return when
`user.role !== "ATHLETE"`**: admins never enter the athlete flow (no onboarding,
no cycle/gestational tracking, no routine, no supplements, no profile). They
only see the admin screen + language switch + logout.

- Super admin: create gym-admin accounts; list them.
- Gym admin: create own gyms; see code + QR; **list their machines**, add,
  **edit** (name, description, weight factor, photo) and **delete** them. The AI
  infers machine type/purpose/weight factor from the name on creation.
- Machine photos are **uploaded files**, compressed client-side (canvas, max
  1024 px, JPEG q0.8) and stored as a data URL in `gym_machines.image_url`
  (`fileToDataUrl` in `lib/api.ts`). No upload endpoint / static serving needed.
- All admin strings go through `lib/i18n.ts` (EN/ES/ZH); `AdminShell` passes
  `language` to `AdminPanel`.
- Athletes join a gym by code from the "My machines" tab.

Backend endpoints: `POST/PATCH/DELETE /api/v1/gyms/{gym_id}/machines[/{machine_id}]`
(owner only).

## Improve later (no context needed)
- Split into `/admin/super` and `/admin/gym` routes with their own layouts.
- Move from data URLs to real object storage (S3/presigned URLs) for large photo sets.
- Reorder machines, richer per-machine calibration, roles matrix, audit log,
  pagination for gym admins.

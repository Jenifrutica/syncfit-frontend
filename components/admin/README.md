# Admin UI (temporary)

**Temporary single screen** for super admins and gym admins, mounted by
`AdminShell.tsx`. To be split into proper pages later (see notes below).

`AdminShell` is rendered by `app/page.tsx` as an **early return when
`user.role !== "ATHLETE"`**: admins never enter the athlete flow (no onboarding,
no cycle/gestational tracking, no routine, no supplements, no profile). They
only see the admin screen + language switch + logout.

- Super admin: create gym-admin accounts; list them.
- Gym admin: create own gyms; see code + QR; add machines (name + description +
  photo URL). The AI infers machine type/purpose/weight factor from the name.
- Athletes join a gym by code from the "My machines" tab.

## Improve later (no context needed)
- Split into `/admin/super` and `/admin/gym` routes with their own layouts.
- Real photo upload (S3/presigned URLs) instead of a URL field.
- Edit/delete machines, reorder, per-machine weight calibration.
- Roles matrix and audit log; pagination for gym admins.

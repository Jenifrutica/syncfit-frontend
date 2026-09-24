# Auth (login/signup) — decoupled

The login/signup and onboarding UI is isolated here so it can be reworked
without touching the rest of the app.

- `AuthPanel.tsx` — sign in / sign up form.
- `OnboardingPanel.tsx` — first-run profile setup.

They are dumb components: they receive state + callbacks as props from the page,
and call `login/register/updateMyProfile` from `lib/api.ts`.

## Improve auth without context
Swap `AuthPanel`/`OnboardingPanel` for any implementation (OAuth, magic link,
multi-step wizard) keeping the same props. The token lives in `lib/api.ts`
(`getToken/setToken`, header `Authorization: Bearer`). No other module depends
on the auth UI internals.

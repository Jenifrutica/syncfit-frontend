/**
 * Creates the local test athlete that the quick-access button fills in
 * (see scripts/e2e-frontend.sh). Idempotent: a second registration is a 409.
 */
import { hashPassword } from "../../lib/password";

export const DEMO_ATHLETE = { email: "pw-demo-atleta@example.com", password: "PwDemo2026!" };

export default async function globalSetup() {
  const api = process.env.E2E_API ?? "http://localhost:8001";
  const digest = await hashPassword(DEMO_ATHLETE.email, DEMO_ATHLETE.password);
  const register = await fetch(`${api}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: DEMO_ATHLETE.email, password: digest, display_name: "Atleta Demo", document_id: "9900000042" }),
  });
  if (register.status !== 201 && register.status !== 409) throw new Error(`demo athlete: ${register.status}`);
  const login = await fetch(`${api}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: DEMO_ATHLETE.email, password: digest }),
  });
  if (!login.ok) throw new Error(`demo athlete login: ${login.status}`);
  const token = (await login.json()).access_token;
  await fetch(`${api}/api/v1/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ modality: "MENSTRUAL_CYCLE", objective: "HYPERTROPHY", age: 28, weight_kg: 60, height_cm: 165 }),
  });
}

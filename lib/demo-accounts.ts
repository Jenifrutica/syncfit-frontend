import type { DemoRole } from "@/lib/api";

export type DemoAccount = { email: string; password: string };

/**
 * Evaluation accounts shown by the quick-access buttons on /entrar.
 * Read at build time from NEXT_PUBLIC_DEMO_ACCOUNTS (a JSON object keyed by
 * role) kept in an untracked .env.*.local file, so the passwords never reach
 * git. They do end up in the published page: use them only for the evaluation.
 */
export function demoAccounts(): Partial<Record<DemoRole, DemoAccount>> {
  try {
    const parsed = JSON.parse(process.env.NEXT_PUBLIC_DEMO_ACCOUNTS ?? "{}") as Record<string, Partial<DemoAccount>>;
    const result: Partial<Record<DemoRole, DemoAccount>> = {};
    for (const role of ["SUPER_ADMIN", "GYM_ADMIN", "ATHLETE"] as const) {
      const entry = parsed[role];
      if (entry?.email && entry.password) result[role] = { email: entry.email, password: entry.password };
    }
    return result;
  } catch {
    return {};
  }
}

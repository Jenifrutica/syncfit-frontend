"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Eye, Key, MagnifyingGlass, PencilSimple, Plus, Power, Trash, UserSwitch } from "@phosphor-icons/react";

import { cx } from "@/lib/cx";
import { Badge } from "@/components/ui/Chip";
import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Choice } from "@/components/ui/Choice";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input, Select } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { EmptyState, Skeleton, SkeletonGroup } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { PanelShell } from "@/components/paneles/PanelShell";
import {
  ApiError,
  createGymAdmin,
  deleteUser,
  getUserDetail,
  listAllGyms,
  listGymAdmins,
  listUsers,
  resetUserPassword,
  setUserActive,
  setUserRole,
  updateUser,
  type AdminUser,
  type AuthUser,
  type GymInfo,
} from "@/lib/api";
import { goalLabel, objectiveLabel, t, tf } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { isValidDocumentId, isValidEmail, isValidName, isValidNewPassword } from "@/lib/validation";

type Tab = "usuarios" | "admins" | "gyms";
type RoleFilter = "ALL" | AuthUser["role"];
const ROLES: AuthUser["role"][] = ["ATHLETE", "GYM_ADMIN", "SUPER_ADMIN"];
type Action = { kind: "ver" | "editar" | "clave" | "rol" | "borrar"; user: AdminUser };

const ROLE_TONE: Record<AuthUser["role"], "fase" | "aviso" | "lavanda"> = { ATHLETE: "fase", GYM_ADMIN: "aviso", SUPER_ADMIN: "lavanda" };

export function SuperAdminScreen() {
  const { user: me, language } = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("usuarios");
  const say = useCallback((title: string, tone: "exito" | "error" = "exito") => toast({ tone, title, closeLabel: t(language, "comun.cerrar") }), [toast, language]);

  return (
    <PanelShell title={t(language, "super.titulo")} subtitle={t(language, "super.sub")}>
      <Choice
        legend={t(language, "super.titulo")}
        hideLegend
        variant="segmentado"
        value={tab}
        onChange={setTab}
        className="max-w-xl"
        options={[
          { value: "usuarios", label: t(language, "super.tab.usuarios") },
          { value: "admins", label: t(language, "super.tab.admins") },
          { value: "gyms", label: t(language, "super.tab.gyms") },
        ]}
      />
      {tab === "usuarios" && <Accounts me={me} say={say} />}
      {tab === "admins" && <GymAdmins say={say} />}
      {tab === "gyms" && <AllGyms />}
    </PanelShell>
  );
}

function errorKey(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) return "super.claveIncorrecta";
    if (error.status === 409) return "super.duplicado";
    if (error.status === 422) return "error.nombre";
  }
  return "super.error";
}

function Accounts({ me, say }: { me: AuthUser | null; say: (title: string, tone?: "exito" | "error") => void }) {
  const { language } = useSession();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [action, setAction] = useState<Action | null>(null);

  const load = useCallback(async () => {
    try {
      setUsers(await listUsers(search.trim() || undefined, role === "ALL" ? undefined : role));
    } catch {
      setUsers([]);
      say(t(language, "super.error"), "error");
    }
  }, [search, role, language, say]);

  // Search as you type, debounced.
  useEffect(() => {
    const id = window.setTimeout(() => void load(), 300);
    return () => window.clearTimeout(id);
  }, [load]);

  const toggleActive = async (u: AdminUser) => {
    try {
      await setUserActive(u.id, !u.active);
      say(t(language, "super.guardado"));
      await load();
    } catch (error) {
      say(t(language, errorKey(error)), "error");
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <MagnifyingGlass size={20} weight="bold" aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-suave" />
          <Input type="search" aria-label={t(language, "super.buscar")} placeholder={t(language, "super.buscar")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-12" />
        </div>
        <Choice
          legend={t(language, "super.rol")}
          hideLegend
          variant="segmentado"
          value={role}
          onChange={setRole}
          options={[{ value: "ALL" as RoleFilter, label: t(language, "super.todos") }, ...ROLES.map((r) => ({ value: r as RoleFilter, label: t(language, `admin.rol.${r}`) }))]}
        />
      </div>

      <div className="overflow-x-auto overflow-y-hidden rounded-nube bg-nube shadow-nube">
        {!users ? (
          <SkeletonGroup label={t(language, "super.cargando")} className="p-4">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12" />)}
          </SkeletonGroup>
        ) : users.length === 0 ? (
          <EmptyState mood="dormida" title={t(language, "super.sinResultados")} />
        ) : (
          <table className="w-full min-w-[56rem] border-collapse text-left text-body">
            <thead>
              <tr className="text-caption font-extrabold text-ink-suave">
                {["super.nombre", "super.correo", "super.cedula", "super.rol", "super.estado"].map((k) => (
                  <th key={k} scope="col" className="px-4 py-3">{t(language, k)}</th>
                ))}
                <th scope="col" className="px-4 py-3 text-right">{t(language, "super.acciones")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const self = u.id === me?.id;
                return (
                  <tr key={u.id} className={cx("border-t border-rosa-claro", !u.active && "bg-rosa-claro/60")}>
                    <td className="px-4 py-3 font-display font-semibold">{u.display_name}</td>
                    <td className="px-4 py-3 text-small font-bold text-ink-suave">{u.email}</td>
                    <td className="px-4 py-3 text-small font-bold tabular-nums">{u.document_id ?? "—"}</td>
                    <td className="px-4 py-3"><Badge tone={ROLE_TONE[u.role]}>{t(language, `admin.rol.${u.role}`)}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={u.active ? "exito" : "peligro"}>{t(language, u.active ? "super.activa" : "super.inactiva")}</Badge></td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1">
                        <IconButton label={`${t(language, "super.ver")} · ${u.display_name}`} variant="suave" onClick={() => setAction({ kind: "ver", user: u })}><Eye size={18} weight="bold" /></IconButton>
                        <IconButton label={`${t(language, "super.editar")} · ${u.display_name}`} variant="suave" onClick={() => setAction({ kind: "editar", user: u })}><PencilSimple size={18} weight="bold" /></IconButton>
                        <IconButton label={`${t(language, u.active ? "super.desactivar" : "super.activar")} · ${u.display_name}`} variant="suave" disabled={self} onClick={() => void toggleActive(u)}><Power size={18} weight="bold" /></IconButton>
                        <IconButton label={`${t(language, "super.clave")} · ${u.display_name}`} variant="suave" onClick={() => setAction({ kind: "clave", user: u })}><Key size={18} weight="bold" /></IconButton>
                        <IconButton label={`${t(language, "super.cambiarRol")} · ${u.display_name}`} variant="suave" disabled={self} onClick={() => setAction({ kind: "rol", user: u })}><UserSwitch size={18} weight="bold" /></IconButton>
                        <IconButton label={`${t(language, "super.borrar")} · ${u.display_name}`} variant="peligro" disabled={self} onClick={() => setAction({ kind: "borrar", user: u })}><Trash size={18} weight="bold" /></IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AccountDialog action={action} onClose={() => setAction(null)} onDone={async (message) => { setAction(null); say(message); await load(); }} />
    </section>
  );
}

function AccountDialog({ action, onClose, onDone }: { action: Action | null; onClose: () => void; onDone: (message: string) => void }) {
  const { language } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [doc, setDoc] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AuthUser["role"]>("ATHLETE");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<Record<string, unknown> | null | undefined>(undefined);

  useEffect(() => {
    if (!action) return;
    setName(action.user.display_name);
    setEmail(action.user.email);
    setDoc(action.user.document_id ?? "");
    setPassword("");
    setRole(action.user.role);
    setError(null);
    setDetail(undefined);
    if (action.kind === "ver") getUserDetail(action.user.id).then((d) => setDetail(d.profile)).catch(() => setDetail(null));
  }, [action]);

  const labels = { showLabel: t(language, "entrar.clave.mostrar"), hideLabel: t(language, "entrar.clave.ocultar") };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!action) return;
    const u = action.user;
    setError(null);
    try {
      setBusy(true);
      if (action.kind === "editar") {
        if (!isValidName(name)) throw new Error("error.nombre");
        if (!isValidEmail(email)) throw new Error("error.correo");
        if (doc && !isValidDocumentId(doc)) throw new Error("error.cedula");
        const patch: Record<string, string> = {};
        if (name.trim() !== u.display_name) patch.display_name = name.trim();
        if (email.trim().toLowerCase() !== u.email) patch.email = email.trim().toLowerCase();
        if (doc && doc !== (u.document_id ?? "")) patch.document_id = doc;
        if (Object.keys(patch).length) await updateUser(u.id, patch);
        onDone(t(language, "super.guardado"));
      } else if (action.kind === "clave") {
        if (!isValidNewPassword(password)) throw new Error("error.clave");
        await resetUserPassword(u.id, password);
        onDone(t(language, "super.claveHecha"));
      } else if (action.kind === "rol") {
        await setUserRole(u.id, role, password);
        onDone(t(language, "super.guardado"));
      } else if (action.kind === "borrar") {
        await deleteUser(u.id, password);
        onDone(t(language, "super.guardado"));
      }
    } catch (err) {
      setError(t(language, err instanceof ApiError ? errorKey(err) : err instanceof Error && err.message.includes(".") ? err.message : "super.error"));
    } finally {
      setBusy(false);
    }
  };

  const title = action ? `${t(language, { ver: "super.detalle", editar: "super.editar", clave: "super.clave", rol: "super.cambiarRol", borrar: "super.borrar" }[action.kind])} · ${action.user.display_name}` : "";
  const adminPassword = (
    <Field label={t(language, "super.tuClave")} hint={t(language, "super.tuClaveAyuda")} error={error}>
      {(control) => <PasswordInput {...control} {...labels} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
    </Field>
  );

  let body: ReactNode = null;
  if (action?.kind === "ver") {
    const p = detail ?? {};
    body =
      detail === undefined ? (
        <Skeleton className="h-32" />
      ) : detail === null ? (
        <p className="text-body text-ink-suave">{t(language, "super.sinPerfil")}</p>
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-body">
          {[
            ["super.modalidad", p.modality ? t(language, `perfil.modalidad.${p.modality}`) : "—"],
            ["nutri.objetivo", p.objective ? objectiveLabel(language, String(p.objective)) : "—"],
            ["nutri.etapa", p.goal_phase ? goalLabel(language, String(p.goal_phase)) : "—"],
            ["onb.altura", p.height_cm ?? "—"],
            ["onb.peso", p.weight_kg ?? "—"],
            ["perfil.ciclo.duracion", p.cycle_length_days ?? "—"],
            ["perfil.embarazo.semana", p.gestation_week ?? "—"],
          ].map(([k, v]) => (
            <div key={String(k)} className="contents">
              <dt className="text-small font-extrabold">{t(language, String(k))}</dt>
              <dd className="font-bold tabular-nums">{String(v)}</dd>
            </div>
          ))}
        </dl>
      );
  } else if (action?.kind === "editar") {
    body = (
      <>
        <Field label={t(language, "super.nombre")}>{(c) => <Input {...c} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label={t(language, "super.correo")}>{(c) => <Input {...c} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
        <Field label={t(language, "super.cedula")} error={error}>{(c) => <Input {...c} inputMode="numeric" value={doc} onChange={(e) => setDoc(e.target.value.replace(/\D/g, ""))} />}</Field>
      </>
    );
  } else if (action?.kind === "clave") {
    body = (
      <Field label={t(language, "super.claveNueva")} hint={t(language, "entrar.clave.ayuda")} error={error}>
        {(c) => <PasswordInput {...c} {...labels} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
      </Field>
    );
  } else if (action?.kind === "rol") {
    body = (
      <>
        <Field label={t(language, "super.nuevoRol")}>
          {(c) => (
            <Select {...c} value={role} onChange={(e) => setRole(e.target.value as AuthUser["role"])}>
              {ROLES.map((r) => <option key={r} value={r}>{t(language, `admin.rol.${r}`)}</option>)}
            </Select>
          )}
        </Field>
        {adminPassword}
      </>
    );
  } else if (action?.kind === "borrar") {
    body = (
      <>
        <p className="text-body font-bold text-peligro">{t(language, "super.borrarDesc")}</p>
        {adminPassword}
      </>
    );
  }

  return (
    <Dialog open={action !== null} onClose={onClose} title={title} closeLabel={t(language, "comun.cerrar")}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {body}
        {action && action.kind !== "ver" && (
          <Button type="submit" variant={action.kind === "borrar" ? "peligro" : "primario"} loading={busy} fullWidth disabled={(action.kind === "rol" || action.kind === "borrar") && !password}>
            {t(language, action.kind === "borrar" ? "super.borrar" : "perfil.guardar")}
          </Button>
        )}
      </form>
    </Dialog>
  );
}

function GymAdmins({ say }: { say: (title: string, tone?: "exito" | "error") => void }) {
  const { language } = useSession();
  const [admins, setAdmins] = useState<AuthUser[] | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => listGymAdmins().then(setAdmins).catch(() => setAdmins([])), []);
  useEffect(() => {
    void load();
  }, [load]);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValidName(name)) return setError(t(language, "error.nombre"));
    if (!isValidEmail(email)) return setError(t(language, "error.correo"));
    if (!isValidNewPassword(password)) return setError(t(language, "error.clave"));
    setBusy(true);
    setError(null);
    try {
      await createGymAdmin(email.trim().toLowerCase(), password, name.trim());
      setName("");
      setEmail("");
      setPassword("");
      say(t(language, "super.admins.creado"));
      await load();
    } catch (err) {
      setError(t(language, errorKey(err) === "super.claveIncorrecta" ? "super.error" : errorKey(err)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <Card tone="crema">
        <form onSubmit={create} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-h3 font-bold">{t(language, "super.admins.crear")}</h2>
            <p className="text-small font-bold text-ink-suave">{t(language, "super.admins.desc")}</p>
          </div>
          <Field label={t(language, "super.nombre")}>{(c) => <Input {...c} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />}</Field>
          <Field label={t(language, "super.correo")}>{(c) => <Input {...c} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />}</Field>
          <Field label={t(language, "entrar.clave")} hint={t(language, "entrar.clave.ayuda")} error={error}>
            {(c) => <PasswordInput {...c} showLabel={t(language, "entrar.clave.mostrar")} hideLabel={t(language, "entrar.clave.ocultar")} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
          </Field>
          <Button type="submit" loading={busy} icon={<Plus size={18} weight="bold" />} className="self-start">{t(language, "super.admins.crear")}</Button>
        </form>
      </Card>
      <Card className="flex flex-col gap-3">
        <h2 className="text-h3 font-bold">{t(language, "super.tab.admins")}</h2>
        {!admins ? (
          <Skeleton className="h-24" />
        ) : admins.length === 0 ? (
          <p className="text-body text-ink-suave">{t(language, "super.admins.ninguno")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {admins.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-ficha bg-rosa-claro px-4 py-3">
                <span className="font-display font-semibold">{a.display_name}</span>
                <span className="text-small font-bold text-ink-suave">{a.email}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function AllGyms() {
  const { language } = useSession();
  const [gyms, setGyms] = useState<GymInfo[] | null>(null);
  const [admins, setAdmins] = useState<AuthUser[]>([]);

  useEffect(() => {
    listAllGyms(language).then(setGyms).catch(() => setGyms([]));
    listGymAdmins().then(setAdmins).catch(() => setAdmins([]));
  }, [language]);

  const owners = useMemo(() => new Map(admins.map((a) => [a.id, a.display_name])), [admins]);

  if (!gyms) return <Skeleton className="h-40" />;
  if (gyms.length === 0) return <Card><EmptyState mood="dormida" title={t(language, "super.gyms.ninguno")} /></Card>;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {gyms.map((g) => (
        <li key={g.id}>
          <Card className="flex h-full flex-col gap-2">
            <h2 className="text-h3 font-bold">{g.name}</h2>
            <p className="font-display text-body-lg font-semibold tracking-widest">#{g.code}</p>
            <p className="text-small font-bold text-ink-suave">
              {[owners.get(g.owner_user_id), tf(language, "gymadmin.nMaquinas", { n: g.machines.length })].filter(Boolean).join(" · ")}
            </p>
          </Card>
        </li>
      ))}
    </ul>
  );
}

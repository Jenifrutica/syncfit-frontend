"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AdminUser,
  AuthUser,
  CatalogItem,
  GymInfo,
  GymMachineInfo,
  addGymMachine,
  createGym,
  createGymAdmin,
  deleteGym,
  deleteGymMachine,
  deleteUser,
  fetchGymQr,
  fileToDataUrl,
  getCatalog,
  listGymAdmins,
  listMyGyms,
  listUsers,
  resetUserPassword,
  setUserActive,
  setUserRole,
  updateGym,
  updateGymMachine,
  updateUser,
} from "@/lib/api";
import { Language, localized, t } from "@/lib/i18n";
import { Dumbbell, Flower } from "@/components/icons";

const EQUIPMENT_KEYS = ["machine", "smith", "barbell", "dumbbell", "bench", "cable", "pullup-bar", "dip-bar", "ghd", "box", "band", "none"];
const EQUIPMENT_LABELS: Record<string, string> = {
  machine: "Máquina / Machine", smith: "Smith", barbell: "Barra / Barbell", dumbbell: "Mancuernas / Dumbbell",
  bench: "Banco / Bench", cable: "Polea / Cable", "pullup-bar": "Barra dominadas / Pull-up bar",
  "dip-bar": "Paralelas / Dip bar", ghd: "GHD", box: "Cajón / Box", band: "Banda / Band", none: "Peso corporal / Bodyweight",
};
const equipmentLabel = (k?: string | null) => EQUIPMENT_LABELS[k ?? "machine"] ?? (k ?? "machine");

interface MachineForm {
  name: string;
  purpose: string;
  image: string;
  exerciseIds: string[];
  equipmentKey: string;
}

function ExercisePicker({ language, value, onChange, options }: { language: Language; value: string[]; onChange: (v: string[]) => void; options: CatalogItem[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options;
  }, [options, query]);
  return (
    <div className="sm:col-span-2">
      <input placeholder={t(language, "adminExerciseSearch")} value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded border border-pink-200 px-2 py-1" />
      <div className="mt-2 flex max-h-32 flex-wrap gap-1 overflow-y-auto">
        {filtered.slice(0, 80).map((o) => {
          const on = value.includes(o.id);
          return (
            <button key={o.id} type="button" onClick={() => onChange(on ? value.filter((x) => x !== o.id) : [...value, o.id])}
              className={`rounded-full border px-2 py-0.5 text-xs ${on ? "border-pink-500 bg-pink-500 text-white" : "border-pink-200 bg-white text-pink-700"}`}>
              {o.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UserConsole({ language }: { language: Language }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = (q = search) => listUsers(q || undefined).then(setUsers).catch((e) => setMsg((e as Error).message));
  useEffect(() => { listUsers().then(setUsers).catch(() => null); }, []);

  const askPassword = () => (typeof window !== "undefined" ? window.prompt(t(language, "adminPassword")) : null);

  return (
    <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-pink-700">{t(language, "adminUsers")}</h3>
      {msg && <p className="text-sm text-pink-700">{msg}</p>}
      <div className="mt-2 flex gap-2">
        <input placeholder={t(language, "adminUserSearch")} value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 rounded border border-pink-200 px-2 py-1" />
        <button onClick={() => refresh()} className="rounded-full bg-pink-500 px-4 py-1 text-sm text-white">{t(language, "searchMachines")}</button>
      </div>
      <ul className="mt-3 space-y-2">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-pink-50 bg-pink-50/30 p-2 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-700">{u.display_name} · <span className="text-slate-500">{u.email}</span></p>
              <p className="text-xs text-slate-500">{u.role} · {u.active ? t(language, "adminActive") : t(language, "adminInactive")} {u.document_id ? `· ${u.document_id}` : ""}</p>
            </div>
            <button onClick={async () => { const name = window.prompt(t(language, "adminName"), u.display_name); if (!name) return; try { await updateUser(u.id, { display_name: name }); refresh(); } catch (e) { setMsg((e as Error).message); } }} className="rounded-full bg-pink-100 px-3 py-0.5 text-xs text-pink-700">{t(language, "adminName")}</button>
            <button onClick={async () => { try { await setUserActive(u.id, !u.active); refresh(); } catch (e) { setMsg((e as Error).message); } }} className="rounded-full bg-white px-3 py-0.5 text-xs text-slate-500">{u.active ? t(language, "adminDeactivate") : t(language, "adminActivate")}</button>
            <button onClick={async () => { const pw = window.prompt(t(language, "adminResetPassword")); if (!pw) return; try { await resetUserPassword(u.id, pw); setMsg(t(language, "adminUpdated")); } catch (e) { setMsg((e as Error).message); } }} className="rounded-full bg-white px-3 py-0.5 text-xs text-slate-500">{t(language, "adminResetPassword")}</button>
            <select
              value={u.role}
              onChange={async (ev) => { const role = ev.target.value; const pw = askPassword(); if (!pw) return; try { await setUserRole(u.id, role, pw); refresh(); } catch (e) { setMsg((e as Error).message); } }}
              className="rounded-full border border-pink-200 bg-white px-2 py-0.5 text-xs text-pink-700"
            >
              <option value="ATHLETE">ATHLETE</option>
              <option value="GYM_ADMIN">GYM_ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
            <button onClick={async () => { if (!window.confirm(t(language, "adminConfirmDelete"))) return; const pw = askPassword(); if (!pw) return; try { await deleteUser(u.id, pw); refresh(); } catch (e) { setMsg((e as Error).message); } }} className="rounded-full bg-white px-3 py-0.5 text-xs text-slate-500">{t(language, "adminDeleteUser")}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminPanel({ user, language }: { user: AuthUser; language: Language }) {
  const isSuper = user.role === "SUPER_ADMIN";
  const [admins, setAdmins] = useState<AuthUser[]>([]);
  const [gyms, setGyms] = useState<GymInfo[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [gymName, setGymName] = useState("");
  const [renaming, setRenaming] = useState<{ gymId: string; name: string } | null>(null);
  const [addGymId, setAddGymId] = useState("");
  const [machine, setMachine] = useState<MachineForm>({ name: "", purpose: "", image: "", exerciseIds: [], equipmentKey: "machine" });
  const [editing, setEditing] = useState<{ gymId: string; machineId: string } | null>(null);
  const [editForm, setEditForm] = useState<MachineForm & { weightFactor: string }>({ name: "", purpose: "", image: "", exerciseIds: [], equipmentKey: "machine", weightFactor: "1" });
  const [qr, setQr] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = () => {
    if (isSuper) listGymAdmins().then(setAdmins).catch(() => null);
    if (!isSuper) {
      listMyGyms(language).then(setGyms).catch(() => null);
      getCatalog(language).then(setCatalog).catch(() => null);
    }
  };
  useEffect(refresh, [isSuper, language]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPickAddImage = async (file: File | undefined) => {
    if (!file) return;
    try { const dataUrl = await fileToDataUrl(file); setMachine((m) => ({ ...m, image: dataUrl })); } catch { setMsg(t(language, "adminChoosePhoto")); }
  };
  const onPickEditImage = async (file: File | undefined) => {
    if (!file) return;
    try { const dataUrl = await fileToDataUrl(file); setEditForm((f) => ({ ...f, image: dataUrl })); } catch { setMsg(t(language, "adminChoosePhoto")); }
  };

  const startEdit = (gymId: string, m: GymMachineInfo) => {
    setEditing({ gymId, machineId: m.id });
    setEditForm({
      name: m.name_text ?? localized(m.name, language),
      purpose: m.purpose_text ?? (m.purpose ? localized(m.purpose, language) : ""),
      weightFactor: String(m.weight_factor ?? 1),
      image: m.image_url ?? "",
      exerciseIds: m.exercise_ids ?? [],
      equipmentKey: m.equipment_key ?? "machine",
    });
    setMsg(null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateGymMachine(editing.gymId, editing.machineId, {
        name: editForm.name, purpose: editForm.purpose, weight_factor: Number(editForm.weightFactor) || 1,
        image_url: editForm.image, exercise_ids: editForm.exerciseIds, equipment_key: editForm.equipmentKey,
      }, language);
      setEditing(null); setMsg(t(language, "adminUpdated")); refresh();
    } catch (e) { setMsg((e as Error).message); }
  };

  const removeMachine = async (gymId: string, machineId: string) => {
    if (typeof window !== "undefined" && !window.confirm(t(language, "adminConfirmDelete"))) return;
    try { await deleteGymMachine(gymId, machineId); if (editing?.machineId === machineId) setEditing(null); setMsg(t(language, "adminDeleted")); refresh(); }
    catch (e) { setMsg((e as Error).message); }
  };

  const removeGym = async (gymId: string) => {
    if (typeof window !== "undefined" && !window.confirm(t(language, "adminConfirmDeleteGym"))) return;
    try { await deleteGym(gymId); setMsg(t(language, "adminDeleted")); refresh(); } catch (e) { setMsg((e as Error).message); }
  };

  const saveGymName = async () => {
    if (!renaming) return;
    try { await updateGym(renaming.gymId, renaming.name, language); setRenaming(null); setMsg(t(language, "adminUpdated")); refresh(); }
    catch (e) { setMsg((e as Error).message); }
  };

  const equipmentSelect = (value: string, onChange: (v: string) => void) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded border border-pink-200 px-2 py-1">
      {EQUIPMENT_KEYS.map((k) => (<option key={k} value={k}>{equipmentLabel(k)}</option>))}
    </select>
  );

  const editFormFields = (
    <div className="mt-2 grid gap-2 rounded-xl bg-pink-50/60 p-3 sm:grid-cols-2">
      <input placeholder={t(language, "adminMachineName")} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="rounded border border-pink-200 px-2 py-1" />
      <input placeholder={t(language, "adminWeightFactor")} value={editForm.weightFactor} onChange={(e) => setEditForm({ ...editForm, weightFactor: e.target.value })} className="rounded border border-pink-200 px-2 py-1" />
      <input placeholder={t(language, "adminMachinePurpose")} value={editForm.purpose} onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })} className="rounded border border-pink-200 px-2 py-1 sm:col-span-2" />
      {equipmentSelect(editForm.equipmentKey, (v) => setEditForm({ ...editForm, equipmentKey: v }))}
      <ExercisePicker language={language} value={editForm.exerciseIds} onChange={(v) => setEditForm({ ...editForm, exerciseIds: v })} options={catalog} />
      <div className="flex items-center gap-3 sm:col-span-2">
        {editForm.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={editForm.image} alt="" className="h-12 w-12 rounded object-cover" />
        ) : null}
        <label className="cursor-pointer rounded-full bg-pink-100 px-3 py-1 text-xs text-pink-700">
          {t(language, "adminChoosePhoto")}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickEditImage(e.target.files?.[0])} />
        </label>
        {editForm.image ? (<button onClick={() => setEditForm({ ...editForm, image: "" })} className="text-xs text-slate-500 underline">{t(language, "adminRemovePhoto")}</button>) : null}
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <button onClick={saveEdit} disabled={!editForm.name.trim()} className="rounded-full bg-pink-500 px-4 py-1 text-sm text-white disabled:opacity-50">{t(language, "adminSave")}</button>
        <button onClick={() => setEditing(null)} className="rounded-full bg-white px-4 py-1 text-sm text-slate-600">{t(language, "adminCancel")}</button>
      </div>
    </div>
  );

  return (
    <section className="mt-5 space-y-6">
      <h2 className="flex items-center gap-2 text-xl font-bold text-pink-700"><Flower size={20} /> {t(language, "adminTitle")} · {user.role}</h2>
      {msg && <p className="text-sm text-pink-700">{msg}</p>}

      {isSuper ? (
        <>
          <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-pink-700">{t(language, "adminCreateGymAdmin")}</h3>
            <p className="text-xs text-slate-500">{t(language, "adminTemporary")}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <input placeholder={t(language, "adminEmail")} value={email} onChange={(e) => setEmail(e.target.value)} className="rounded border border-pink-200 px-2 py-1" />
              <input placeholder={t(language, "adminPassword")} value={password} onChange={(e) => setPassword(e.target.value)} className="rounded border border-pink-200 px-2 py-1" />
              <input placeholder={t(language, "adminName")} value={name} onChange={(e) => setName(e.target.value)} className="rounded border border-pink-200 px-2 py-1" />
            </div>
            <button onClick={async () => { try { await createGymAdmin(email, password, name); setMsg(t(language, "adminCreated")); setEmail(""); setPassword(""); setName(""); refresh(); } catch (e) { setMsg((e as Error).message); } }} className="mt-3 rounded-full bg-pink-500 px-4 py-2 text-sm text-white">{t(language, "adminCreate")}</button>
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-slate-700">{t(language, "adminGymAdmins")}</h4>
              <ul className="mt-1 text-sm text-slate-600">{admins.map((a) => (<li key={a.id}>{a.display_name} · {a.email}</li>))}</ul>
            </div>
          </div>
          <UserConsole language={language} />
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-pink-700">{t(language, "adminMyGyms")}</h3>
            <div className="mt-2 flex gap-2">
              <input placeholder={t(language, "adminGymName")} value={gymName} onChange={(e) => setGymName(e.target.value)} className="rounded border border-pink-200 px-2 py-1" />
              <button onClick={async () => { try { await createGym(gymName); setGymName(""); refresh(); } catch (e) { setMsg((e as Error).message); } }} className="rounded-full bg-pink-500 px-4 py-1 text-sm text-white">{t(language, "adminCreateGym")}</button>
            </div>
            <ul className="mt-3 space-y-4">
              {gyms.map((g) => (
                <li key={g.id} className="rounded-xl border border-pink-100 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                    {renaming?.gymId === g.id ? (
                      <>
                        <input value={renaming.name} onChange={(e) => setRenaming({ ...renaming, name: e.target.value })} className="rounded border border-pink-200 px-2 py-0.5" />
                        <button onClick={saveGymName} className="rounded-full bg-pink-500 px-3 py-0.5 text-xs text-white">{t(language, "adminSave")}</button>
                        <button onClick={() => setRenaming(null)} className="rounded-full bg-white px-3 py-0.5 text-xs text-slate-500">{t(language, "adminCancel")}</button>
                      </>
                    ) : (
                      <>
                        <strong>{g.name}</strong>
                        <span>· {t(language, "adminCode")} <code className="rounded-full bg-pink-100 px-2 py-0.5 font-mono text-xs text-pink-700">{g.code}</code></span>
                        <span>· {g.machines.length} {t(language, "adminMachinesCount")}</span>
                        <button onClick={() => setRenaming({ gymId: g.id, name: g.name })} className="rounded-full bg-pink-100 px-3 py-0.5 text-xs text-pink-700">{t(language, "adminEditGym")}</button>
                        <button onClick={() => removeGym(g.id)} className="rounded-full bg-white px-3 py-0.5 text-xs text-slate-500">{t(language, "adminDeleteGym")}</button>
                        <button onClick={async () => { const url = await fetchGymQr(g.id); setQr((q) => ({ ...q, [g.id]: url })); }} className="rounded-full bg-pink-100 px-3 py-0.5 text-xs text-pink-700">{t(language, "adminShowQr")}</button>
                      </>
                    )}
                  </div>
                  {qr[g.id] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qr[g.id]} alt="QR" className="mt-2 h-40 w-40" />
                  )}
                  <h4 className="mt-3 text-sm font-semibold text-slate-700">{t(language, "adminEquipment")}</h4>
                  {g.machines.length === 0 ? (
                    <p className="text-xs text-slate-500">{t(language, "adminNoMachines")}</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {g.machines.map((m) => (
                        <li key={m.id} className="rounded-lg border border-pink-50 bg-pink-50/30 p-2">
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            {m.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.image_url} alt="" className="h-12 w-12 rounded object-cover" />
                            ) : (
                              <span className="flex h-12 w-12 items-center justify-center rounded bg-white text-pink-300"><Dumbbell size={20} /></span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-slate-700">{m.name_text ?? localized(m.name, language)}</p>
                              <p className="truncate text-xs text-slate-500">{equipmentLabel(m.equipment_key)} · {t(language, "adminWeightFactor")} {m.weight_factor}{(m.exercise_ids?.length ?? 0) > 0 ? ` · ${m.exercise_ids?.length} ex` : ""}</p>
                            </div>
                            <button onClick={() => (editing?.machineId === m.id ? setEditing(null) : startEdit(g.id, m))} className="rounded-full bg-pink-100 px-3 py-0.5 text-xs text-pink-700">{t(language, "adminEditMachine")}</button>
                            <button onClick={() => removeMachine(g.id, m.id)} className="rounded-full bg-white px-3 py-0.5 text-xs text-slate-500">{t(language, "adminDeleteMachine")}</button>
                          </div>
                          {editing?.machineId === m.id && editFormFields}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-semibold text-pink-700"><Dumbbell size={18} /> {t(language, "adminAddMachine")}</h3>
            <p className="text-xs text-slate-500">{t(language, "adminAiHint")}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <select value={addGymId} onChange={(e) => setAddGymId(e.target.value)} className="rounded border border-pink-200 px-2 py-1 sm:col-span-2">
                <option value="">{t(language, "adminPickGym")}</option>
                {gyms.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
              </select>
              <input placeholder={t(language, "adminMachineName")} value={machine.name} onChange={(e) => setMachine({ ...machine, name: e.target.value })} className="rounded border border-pink-200 px-2 py-1 sm:col-span-2" />
              <input placeholder={t(language, "adminMachinePurpose")} value={machine.purpose} onChange={(e) => setMachine({ ...machine, purpose: e.target.value })} className="rounded border border-pink-200 px-2 py-1 sm:col-span-2" />
              {equipmentSelect(machine.equipmentKey, (v) => setMachine({ ...machine, equipmentKey: v }))}
              <ExercisePicker language={language} value={machine.exerciseIds} onChange={(v) => setMachine({ ...machine, exerciseIds: v })} options={catalog} />
              <div className="flex items-center gap-3 sm:col-span-2">
                {machine.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={machine.image} alt="" className="h-12 w-12 rounded object-cover" />
                ) : null}
                <label className="cursor-pointer rounded-full bg-pink-100 px-3 py-1 text-xs text-pink-700">
                  {t(language, "adminChoosePhoto")}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickAddImage(e.target.files?.[0])} />
                </label>
                {machine.image ? (<button onClick={() => setMachine({ ...machine, image: "" })} className="text-xs text-slate-500 underline">{t(language, "adminRemovePhoto")}</button>) : null}
              </div>
            </div>
            <button
              disabled={!addGymId || !machine.name.trim()}
              onClick={async () => {
                try {
                  await addGymMachine(addGymId, machine.name, machine.purpose, machine.image, language, machine.exerciseIds, machine.equipmentKey);
                  setMsg(t(language, "adminCreated"));
                  setMachine({ name: "", purpose: "", image: "", exerciseIds: [], equipmentKey: "machine" });
                  refresh();
                } catch (e) { setMsg((e as Error).message); }
              }}
              className="mt-3 rounded-full bg-pink-500 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {t(language, "adminAddMachine")}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default AdminPanel;

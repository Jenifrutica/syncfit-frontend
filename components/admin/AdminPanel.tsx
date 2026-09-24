"use client";

import { useEffect, useState } from "react";

import {
  AuthUser,
  GymInfo,
  addGymMachine,
  createGym,
  createGymAdmin,
  fetchGymQr,
  listGymAdmins,
  listMyGyms,
} from "@/lib/api";
import { Dumbbell, Flower } from "@/components/icons";

export function AdminPanel({ user }: { user: AuthUser }) {
  const isSuper = user.role === "SUPER_ADMIN";
  const [admins, setAdmins] = useState<AuthUser[]>([]);
  const [gyms, setGyms] = useState<GymInfo[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [gymName, setGymName] = useState("");
  const [machine, setMachine] = useState({ gymId: "", name: "", purpose: "", image: "" });
  const [qr, setQr] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = () => {
    if (isSuper) listGymAdmins().then(setAdmins).catch(() => null);
    listMyGyms().then(setGyms).catch(() => null);
  };
  useEffect(refresh, [isSuper]);

  return (
    <section className="mt-5 space-y-6">
      <h2 className="flex items-center gap-2 text-xl font-bold text-pink-700"><Flower size={20} /> Admin · {user.role}</h2>
      {msg && <p className="text-sm text-pink-700">{msg}</p>}

      {isSuper && (
        <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-pink-700">Crear admin de gimnasio</h3>
          <p className="text-xs text-slate-500">Temporal: una sola pantalla. El gymAdmin creará su propio gimnasio.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded border border-pink-200 px-2 py-1" />
            <input placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded border border-pink-200 px-2 py-1" />
            <input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} className="rounded border border-pink-200 px-2 py-1" />
          </div>
          <button
            onClick={async () => {
              try { await createGymAdmin(email, password, name); setMsg("Admin creado"); setEmail(""); setPassword(""); setName(""); refresh(); }
              catch (e) { setMsg((e as Error).message); }
            }}
            className="mt-3 rounded-full bg-pink-500 px-4 py-2 text-sm text-white"
          >
            Crear admin
          </button>
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-slate-700">Admins de gimnasio</h4>
            <ul className="mt-1 text-sm text-slate-600">
              {admins.map((a) => (<li key={a.id}>{a.display_name} · {a.email}</li>))}
            </ul>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-pink-700">Mis gimnasios</h3>
        <div className="mt-2 flex gap-2">
          <input placeholder="Nombre del gimnasio" value={gymName} onChange={(e) => setGymName(e.target.value)} className="rounded border border-pink-200 px-2 py-1" />
          <button onClick={async () => { try { await createGym(gymName); setGymName(""); refresh(); } catch (e) { setMsg((e as Error).message); } }} className="rounded-full bg-pink-500 px-4 py-1 text-sm text-white">Crear gimnasio</button>
        </div>
        <ul className="mt-3 space-y-1 text-sm text-slate-700">
          {gyms.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center gap-2">
              <strong>{g.name}</strong> · código <code className="rounded bg-pink-50 px-2">{g.code}</code> · {g.machines.length} máquinas
              <button onClick={async () => { const url = await fetchGymQr(g.id); setQr((q) => ({ ...q, [g.id]: url })); }} className="rounded-full bg-pink-100 px-3 py-0.5 text-xs text-pink-700">Ver QR</button>
            </li>
          ))}
        </ul>
        {Object.entries(qr).map(([id, url]) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={id} src={url} alt="QR" className="mt-2 h-40 w-40" />
        ))}
      </div>

      <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-pink-700"><Dumbbell size={18} /> Agregar máquina</h3>
        <p className="text-xs text-slate-500">La foto es solo de guía; la IA infiere tipo y propósito desde el nombre/descripción.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <select value={machine.gymId} onChange={(e) => setMachine({ ...machine, gymId: e.target.value })} className="rounded border border-pink-200 px-2 py-1">
            <option value="">Elige gimnasio</option>
            {gyms.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
          </select>
          <input placeholder="Nombre de la máquina" value={machine.name} onChange={(e) => setMachine({ ...machine, name: e.target.value })} className="rounded border border-pink-200 px-2 py-1" />
          <input placeholder="Descripción (opcional)" value={machine.purpose} onChange={(e) => setMachine({ ...machine, purpose: e.target.value })} className="rounded border border-pink-200 px-2 py-1 sm:col-span-2" />
          <input placeholder="URL de foto (opcional)" value={machine.image} onChange={(e) => setMachine({ ...machine, image: e.target.value })} className="rounded border border-pink-200 px-2 py-1 sm:col-span-2" />
        </div>
        <button
          disabled={!machine.gymId || !machine.name}
          onClick={async () => {
            try { await addGymMachine(machine.gymId, machine.name, machine.purpose, machine.image); setMsg("Máquina agregada (IA infirió tipo/propósito)"); setMachine({ gymId: machine.gymId, name: "", purpose: "", image: "" }); refresh(); }
            catch (e) { setMsg((e as Error).message); }
          }}
          className="mt-3 rounded-full bg-pink-500 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Agregar
        </button>
      </div>
    </section>
  );
}

export default AdminPanel;

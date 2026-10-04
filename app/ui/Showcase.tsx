"use client";

import { useState, type ReactNode } from "react";
import { Barbell, Heartbeat, Lightning, Moon, Play, ShieldCheck } from "@phosphor-icons/react";

import { Badge, Chip } from "@/components/ui/Chip";
import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState, ProgressBar, Skeleton, SkeletonGroup } from "@/components/ui/States";
import { Field, Input, Select } from "@/components/ui/Field";
import { StoryCard } from "@/components/ui/StoryCard";
import { useToast } from "@/components/ui/Toast";
import { Pulsi, type PulsiMood } from "@/components/mascot/Pulsi";
import { Cloud } from "@/components/decor/Cloud";
import { DripDivider } from "@/components/decor/DripDivider";
import { CycleRing } from "@/components/cycle/CycleRing";
import { WeekStrip, type WeekDay } from "@/components/cycle/WeekStrip";
import { CYCLE_PHASES, FASE_COLOR, FASE_TOKEN, GESTATION_SEGMENTS, estimateCycleSegments, faseLabel, type Fase } from "@/lib/fases";

const MOODS: PulsiMood[] = ["feliz", "cansada", "alerta", "dormida"];

const WEEK: WeekDay[] = [
  { key: "28", weekday: "L", day: 28, fase: "FOLLICULAR", label: "Lunes 28, folicular" },
  { key: "29", weekday: "M", day: 29, fase: "FOLLICULAR", label: "Martes 29, folicular" },
  { key: "30", weekday: "M", day: 30, fase: "FOLLICULAR", label: "Miércoles 30, folicular" },
  { key: "1", weekday: "J", day: 1, fase: "FOLLICULAR", label: "Jueves 1, folicular" },
  { key: "2", weekday: "V", day: 2, fase: "OVULATORY", label: "Viernes 2, ovulatoria" },
  { key: "3", weekday: "S", day: 3, fase: "OVULATORY", label: "Sábado 3, ovulatoria" },
  { key: "4", weekday: "D", day: 4, fase: "OVULATORY", label: "Domingo 4, ovulatoria" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-h2 font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function Showcase() {
  const toast = useToast();
  const [fase, setFase] = useState<Fase>("OVULATORY");
  const [sheet, setSheet] = useState(false);
  const [modal, setModal] = useState(false);
  const [day, setDay] = useState("3");
  const [chips, setChips] = useState<Record<string, boolean>>({ Glúteos: true, Espalda: false, Core: false });
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const fakeSave = () => {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      toast({ tone: "exito", title: "Rutina guardada", description: "La verás en Hoy.", closeLabel: "Cerrar" });
    }, 1200);
  };

  return (
    <div data-fase={fase} className="min-h-svh">
      <header className="relative overflow-hidden bg-fase-suave px-4 pt-10 pb-4 sm:px-8">
        <Cloud className="absolute top-6 -left-6 text-nube/80" width={220} />
        <Cloud className="absolute top-16 right-4 text-nube/70" width={160} />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
          <Pulsi mood="feliz" size={120} wings animated title="Pulsi" />
          <h1 className="text-display font-bold">Sistema de diseño</h1>
          <p className="max-w-xl text-body-lg font-bold text-ink-suave">
            Tokens, componentes y a Pulsi en un solo lugar. Cambia la fase para ver cómo el cielo cambia de color.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[...CYCLE_PHASES, "TRIMESTER_2" as const].map((f) => (
              <Chip key={f} selected={fase === f} onToggle={() => setFase(f)}>
                {faseLabel(f, "ES")}
              </Chip>
            ))}
          </div>
        </div>
      </header>
      <DripDivider variant="gotea" className="bg-rosa text-fase-suave" />

      <main className="mx-auto flex max-w-5xl flex-col gap-16 px-4 pt-6 pb-24 sm:px-8">
        <Section title="Colores">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { cls: "bg-rosa", name: "rosa", use: "60 % cielo" },
              { cls: "bg-nube", name: "nube", use: "tarjetas" },
              { cls: "bg-crema", name: "crema", use: "acentos cálidos" },
              { cls: "bg-ink text-nube", name: "ink", use: "texto y acción" },
              { cls: "bg-lavanda text-nube", name: "lavanda", use: "secciones hondas" },
              ...[...CYCLE_PHASES, "TRIMESTER_1" as const].map((f) => ({
                cls: "",
                bg: FASE_COLOR[f].base,
                name: FASE_TOKEN[f],
                use: f === "TRIMESTER_1" ? "embarazo" : faseLabel(f, "ES"),
              })),
            ].map(({ cls, bg, name, use }: { cls: string; bg?: string; name: string; use: string }) => (
              <div key={name} className={`flex h-28 flex-col justify-end rounded-ficha p-3 ${cls}`} style={bg ? { background: bg } : undefined}>
                <span className="font-display font-semibold">{name}</span>
                <span className="text-small font-bold">{use}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Tipografía">
          <Card className="flex flex-col gap-3">
            <p className="font-display text-display font-bold">Display</p>
            <p className="font-display text-h1 font-bold">H1 · Entrena con tu ciclo</p>
            <p className="font-display text-h2 font-bold">H2 · Cada fase tiene su clima</p>
            <p className="font-display text-h3 font-bold">H3 · Tu rutina de hoy</p>
            <p className="text-body-lg">Body grande · Nunito para leer cómodo en el gimnasio.</p>
            <p className="text-body">Body · Explicamos cada ajuste en lenguaje simple.</p>
            <p className="text-small font-bold text-ink-suave">Small · datos de apoyo</p>
            <p className="text-caption font-extrabold text-ink-suave">Caption · metadatos</p>
          </Card>
        </Section>

        <Section title="Botones">
          <div className="flex flex-wrap items-center gap-3">
            <Button icon={<Play weight="fill" size={18} />} onClick={fakeSave} loading={loading} loadingLabel="Guardando…">
              Guardar rutina
            </Button>
            <Button variant="secundario">Ver cómo funciona</Button>
            <Button variant="suave">Cambiar</Button>
            <Button variant="peligro">Eliminar</Button>
            <Button variant="fantasma">Saltar</Button>
            <Button disabled>Deshabilitado</Button>
            <IconButton label="Ver energía">
              <Lightning size={20} weight="bold" />
            </IconButton>
          </div>
          <Button size="lg" fullWidth icon={<Heartbeat size={22} weight="bold" />} className="sm:max-w-sm">
            Escanear y crear rutina
          </Button>
        </Section>

        <Section title="Chips y etiquetas">
          <div className="flex flex-wrap gap-2">
            {Object.entries(chips).map(([name, on]) => (
              <Chip key={name} selected={on} onToggle={() => setChips({ ...chips, [name]: !on })}>
                {name}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="exito" icon={<ShieldCheck size={14} weight="bold" />}>Validada</Badge>
            <Badge tone="peligro">Bloqueado</Badge>
            <Badge tone="aviso">Precaución</Badge>
            <Badge tone="fase">Fase actual</Badge>
            <Badge tone="lavanda">Admin gym</Badge>
          </div>
        </Section>

        <Section title="Formularios">
          <Card className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Correo"
              required
              requiredText="(obligatorio)"
              hint="Te enviaremos el resumen de tus entrenos."
              error={emailError}
            >
              {(control) => (
                <Input
                  {...control}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailError(email.includes("@") ? null : "Revisa el correo: le falta la @.")}
                  placeholder="tu@correo.com"
                />
              )}
            </Field>
            <Field label="Objetivo">
              {(control) => (
                <Select {...control} defaultValue="fuerza">
                  <option value="fuerza">Ganar fuerza</option>
                  <option value="tono">Tonificar</option>
                  <option value="salud">Salud general</option>
                </Select>
              )}
            </Field>
          </Card>
        </Section>

        <Section title="Pulsi">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {MOODS.map((mood) => (
              <Card key={mood} className="flex flex-col items-center gap-2">
                <Pulsi mood={mood} size={110} animated />
                <span className="font-display text-h3 font-semibold capitalize">{mood}</span>
              </Card>
            ))}
          </div>
        </Section>

        <Section title="Ciclo">
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="flex flex-col items-center gap-4">
              <WeekStrip days={WEEK} selected={day} onSelect={setDay} className="w-full" />
              <CycleRing segments={estimateCycleSegments(28)} position={14} label="Día 14 de 28, fase ovulatoria">
                <Pulsi mood="alerta" size={70} />
                <span className="font-display text-h2 font-bold">Día 14</span>
                <span className="text-small font-extrabold">Ovulatoria</span>
              </CycleRing>
            </Card>
            <Card className="flex flex-col items-center justify-center gap-4" data-fase="TRIMESTER_2">
              <CycleRing segments={GESTATION_SEGMENTS} position={22} label="Semana 22 de 40, segundo trimestre">
                <Pulsi mood="feliz" size={70} />
                <span className="font-display text-h2 font-bold">Semana 22</span>
                <span className="text-small font-extrabold">2.º trimestre</span>
              </CycleRing>
            </Card>
          </div>
        </Section>

        <Section title="Tarjetas e historias">
          <div className="flex flex-wrap gap-4">
            <StoryCard tone="lavanda" icon={<ShieldCheck size={26} weight="bold" />} title="En ovulación cuidamos rodillas: hoy no hay saltos." />
            <StoryCard tone="fase" icon={<Barbell size={26} weight="bold" />} title="3 de 4 entrenos esta semana.">
              Uno más y cumples tu meta.
            </StoryCard>
            <StoryCard tone="crema" icon={<Moon size={26} weight="bold" />} title="Hoy toca descanso activo." />
          </div>
        </Section>

        <Section title="Diálogos y avisos">
          <div className="flex flex-wrap gap-3">
            <Button variant="secundario" onClick={() => setSheet(true)}>Abrir hoja inferior</Button>
            <Button variant="secundario" onClick={() => setModal(true)}>Abrir modal</Button>
            <Button variant="secundario" onClick={() => toast({ tone: "error", title: "No pudimos guardar", description: "Revisa tu conexión e inténtalo de nuevo.", closeLabel: "Cerrar" })}>
              Mostrar error
            </Button>
            <Button variant="secundario" onClick={() => toast({ tone: "info", title: "Tu gimnasio agregó una máquina", closeLabel: "Cerrar" })}>
              Mostrar info
            </Button>
          </div>
        </Section>

        <Section title="Estados">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <SkeletonGroup label="Cargando rutina">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </SkeletonGroup>
            </Card>
            <Card>
              <EmptyState title="Aún no hay rutina" description="Escanéate en la estación para crear la de hoy." action={<Button size="sm">Escanear</Button>} />
            </Card>
            <Card className="flex flex-col justify-center gap-3">
              <span className="text-small font-extrabold">Paso 2 de 6</span>
              <ProgressBar value={2} max={6} label="Paso 2 de 6" />
            </Card>
          </div>
        </Section>
      </main>

      <Dialog
        open={sheet}
        onClose={() => setSheet(false)}
        variant="sheet"
        title="¿Cómo te sientes hoy?"
        description="Lo usamos para ajustar tu carga."
        closeLabel="Cerrar"
        footer={<Button fullWidth onClick={() => setSheet(false)}>Guardar</Button>}
      >
        <div className="flex flex-wrap gap-2">
          {["Con energía", "Normal", "Sin energía", "Cólicos", "Hinchazón"].map((label) => (
            <Chip key={label} selected={label === "Normal"} onToggle={() => undefined}>
              {label}
            </Chip>
          ))}
        </div>
      </Dialog>
      <Dialog
        open={modal}
        onClose={() => setModal(false)}
        title="¿Eliminar esta máquina?"
        description="Las atletas dejarán de verla en sus rutinas."
        closeLabel="Cerrar"
        footer={
          <>
            <Button variant="peligro" onClick={() => setModal(false)}>Eliminar</Button>
            <Button variant="suave" onClick={() => setModal(false)}>Cancelar</Button>
          </>
        }
      >
        <p className="text-body">Esta acción no se puede deshacer.</p>
      </Dialog>
    </div>
  );
}

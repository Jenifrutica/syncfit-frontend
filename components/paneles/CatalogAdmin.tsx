"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MagnifyingGlass, PencilSimple, Plus, Power } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/Chip";
import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CatalogItemForm } from "@/components/paneles/CatalogItemForm";
import { Choice } from "@/components/ui/Choice";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input, Select } from "@/components/ui/Field";
import { RowCheck, SelectionBar } from "@/components/ui/SelectionBar";
import {
  ApiError,
  deactivateAdminOption,
  deleteAdminCatalogItems,
  deleteAdminOptions,
  listAdminCatalog,
  listAdminOptions,
  saveAdminCatalogItem,
  saveAdminOption,
  reactivateAdminCatalogItems,
  reactivateAdminOptions,
  setAdminCatalogActive,
  updateAdminOption,
  type AdminCatalogItem,
  type AdminOption,
  type CatalogKind,
  type OptionCategory,
} from "@/lib/api";
import { t, tf, type Language } from "@/lib/i18n";
import { useSelection } from "@/lib/useSelection";

type Section = "options" | CatalogKind;

const SECTIONS: { value: Section; key: string }[] = [
  { value: "options", key: "super.cat.opciones" },
  { value: "exercise", key: "super.cat.ejercicios" },
  { value: "machine", key: "super.cat.maquinas" },
  { value: "symptom", key: "super.cat.sintomas" },
  { value: "supplement", key: "super.cat.suplementos" },
];

const CATEGORIES: OptionCategory[] = ["muscle_group_isolated", "muscle_group_general", "objective", "goal_phase", "equipment"];

type OptionDraft = {
  id: string | null;
  category: OptionCategory;
  value: string;
  en: string;
  es: string;
  zh: string;
  sort: string;
  active: boolean;
  /** Engine parameters as JSON text (objective scheme, calorie factor...). */
  meta: string;
};

type CatalogDraft = { kind: CatalogKind; id: string | null; payload: Record<string, unknown> };

function detailText(error: unknown): string {
  if (!(error instanceof ApiError)) return "";
  const detail = error.detail as unknown;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const entry = item as { loc?: unknown[]; msg?: string };
        const loc = Array.isArray(entry.loc) ? entry.loc.join(".") : "";
        return [loc, entry.msg].filter(Boolean).join(": ");
      })
      .join(" · ");
  }
  return detail ? JSON.stringify(detail) : "";
}

function itemName(item: AdminCatalogItem, language: Language): string {
  const name = (item.payload as { name?: unknown }).name;
  if (typeof name === "string") return name;
  if (name && typeof name === "object") {
    const entries = name as Record<string, string>;
    return entries[language.toLowerCase()] ?? entries.en ?? item.id;
  }
  return item.id;
}

export function CatalogAdmin({ language, say }: { language: Language; say: (title: string, tone?: "exito" | "error") => void }) {
  const [section, setSection] = useState<Section>("options");
  const [options, setOptions] = useState<AdminOption[] | null>(null);
  const [items, setItems] = useState<AdminCatalogItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [optionDraft, setOptionDraft] = useState<OptionDraft | null>(null);
  const [catalogDraft, setCatalogDraft] = useState<CatalogDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      if (section === "options") setOptions(await listAdminOptions());
      else setItems(await listAdminCatalog(section));
    } catch {
      say(t(language, "super.error"), "error");
    }
  }, [section, language, say]);

  useEffect(() => {
    void load();
  }, [load]);

  const search = query.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    const list = options ?? [];
    if (!search) return list;
    return list.filter((o) => `${o.category} ${o.value} ${Object.values(o.labels).join(" ")}`.toLowerCase().includes(search));
  }, [options, search]);

  const filteredItems = useMemo(() => {
    const list = items ?? [];
    if (!search) return list;
    return list.filter((item) => `${item.id} ${itemName(item, language)}`.toLowerCase().includes(search));
  }, [items, search, language]);

  const grouped = useMemo(() => {
    const map = new Map<string, AdminOption[]>();
    for (const option of filteredOptions) {
      map.set(option.category, [...(map.get(option.category) ?? []), option]);
    }
    return [...map.entries()];
  }, [filteredOptions]);

  const visibleIds = section === "options" ? filteredOptions.map((o) => o.id) : filteredItems.map((i) => i.id);
  const selection = useSelection(visibleIds);

  const bulkDelete = async (ids: string[]) => {
    try {
      const result = section === "options" ? await deleteAdminOptions(ids) : await deleteAdminCatalogItems(section, ids);
      say(tf(language, "sel.hecho", { n: result.deleted.length }));
    } catch {
      say(t(language, "sel.error"), "error");
    }
    await load();
  };

  const bulkReactivate = async (ids: string[]) => {
    try {
      if (section === "options") await reactivateAdminOptions(ids);
      else await reactivateAdminCatalogItems(section, ids);
      say(tf(language, "sel.reactivados", { n: ids.length }));
    } catch {
      say(t(language, "sel.error"), "error");
    }
    await load();
  };

  const openNewOption = () => {
    setError(null);
    setOptionDraft({ id: null, category: "muscle_group_isolated", value: "", en: "", es: "", zh: "", sort: "", active: true, meta: "" });
  };

  const openEditOption = (option: AdminOption) => {
    setError(null);
    setOptionDraft({
      id: option.id,
      category: option.category,
      value: option.value,
      en: option.labels.en ?? "",
      es: option.labels.es ?? "",
      zh: option.labels.zh ?? "",
      sort: String(option.sort_order),
      active: option.active,
      meta: option.meta && Object.keys(option.meta).length ? JSON.stringify(option.meta) : "",
    });
  };

  const saveOption = async () => {
    if (!optionDraft) return;
    const labels: Record<string, string> = {};
    for (const [key, value] of Object.entries({ en: optionDraft.en, es: optionDraft.es, zh: optionDraft.zh })) {
      if (value.trim()) labels[key] = value.trim();
    }
    if (!labels.en) {
      setError(t(language, "super.cat.faltaEn"));
      return;
    }
    const sort = optionDraft.sort.trim() ? Number(optionDraft.sort) : undefined;
    let meta: Record<string, number> | null = null;
    if (optionDraft.meta.trim()) {
      try {
        const parsed = JSON.parse(optionDraft.meta) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("object");
        meta = parsed as Record<string, number>;
      } catch {
        setError(t(language, "catalogo.metaInvalido"));
        return;
      }
    }
    setBusy(true);
    setError(null);
    try {
      if (optionDraft.id) {
        await updateAdminOption(optionDraft.id, { labels, sort_order: sort, active: optionDraft.active, meta });
      } else {
        await saveAdminOption({
          category: optionDraft.category,
          value: optionDraft.value.trim().toUpperCase().replace(/\s+/g, "_"),
          labels,
          sort_order: sort,
          active: optionDraft.active,
          meta,
        });
      }
      setOptionDraft(null);
      say(t(language, "super.guardado"));
      await load();
    } catch (err) {
      setError(detailText(err) || t(language, "super.error"));
    } finally {
      setBusy(false);
    }
  };

  const toggleOption = async (option: AdminOption) => {
    try {
      if (option.active) await deactivateAdminOption(option.id);
      else await updateAdminOption(option.id, { active: true });
      say(t(language, "super.guardado"));
      await load();
    } catch {
      say(t(language, "super.error"), "error");
    }
  };

  const openNewItem = (kind: CatalogKind) => {
    setError(null);
    setCatalogDraft({ kind, id: null, payload: {} });
  };

  const openEditItem = (item: AdminCatalogItem) => {
    setError(null);
    setCatalogDraft({ kind: item.kind, id: item.id, payload: item.payload });
  };

  const saveCatalog = async (payload: Record<string, unknown>) => {
    if (!catalogDraft) return;
    setBusy(true);
    setError(null);
    try {
      await saveAdminCatalogItem(catalogDraft.kind, payload);
      setCatalogDraft(null);
      say(t(language, "super.guardado"));
      await load();
    } catch (err) {
      setError(detailText(err) || t(language, "super.error"));
    } finally {
      setBusy(false);
    }
  };

  const toggleItem = async (item: AdminCatalogItem) => {
    try {
      await setAdminCatalogActive(item.kind, item.id, !item.active);
      say(t(language, "super.guardado"));
      await load();
    } catch {
      say(t(language, "super.error"), "error");
    }
  };

  const optionDialogTitle = optionDraft?.id ? t(language, "super.cat.editar") : t(language, "super.cat.nuevaOpcion");

  return (
    <section className="flex flex-col gap-4">
      <Choice legend={t(language, "super.tab.catalogos")} hideLegend variant="pildoras" value={section} onChange={(value) => setSection(value as Section)} options={SECTIONS.map(({ value, key }) => ({ value, label: t(language, key) }))} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlass size={20} weight="bold" aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-suave" />
          <Input type="search" aria-label={t(language, "super.cat.buscar")} placeholder={t(language, "super.cat.buscar")} value={query} onChange={(e) => setQuery(e.target.value)} className="pl-12" />
        </div>
        <Button
          icon={<Plus size={18} weight="bold" />}
          onClick={() => (section === "options" ? openNewOption() : openNewItem(section))}
        >
          {section === "options" ? t(language, "super.cat.nuevaOpcion") : t(language, "super.cat.nuevoItem")}
        </Button>
      </div>

      <SelectionBar selection={selection} total={visibleIds.length} language={language} onDelete={bulkDelete} onReactivate={bulkReactivate} />

      {section === "options" ? (
        <div className="flex flex-col gap-3">
          {grouped.map(([category, rows]) => (
            <Card key={category} padding="sm" className="flex flex-col gap-1">
              <h3 className="px-2 pt-1 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/50">{t(language, `super.cat.cat.${category}`)}</h3>
              {rows.map((option) => (
                <div key={option.id} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-rosa-claro/60">
                  <RowCheck selection={selection} id={option.id} label={tf(language, "sel.fila", { nombre: option.value })} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-body font-bold">
                      {option.labels[language.toLowerCase()] ?? option.labels.en ?? option.value}
                      <span className="ml-2 font-sans text-small font-bold text-ink-suave">{option.value}</span>
                    </p>
                    <p className="text-small font-semibold text-ink-suave">
                      {Object.entries(option.labels).map(([code, text]) => `${code.toUpperCase()} ${text}`).join(" · ")}
                    </p>
                  </div>
                  <Badge tone={option.active ? "exito" : "aviso"}>{option.active ? t(language, "super.cat.activo") : t(language, "super.cat.inactivo")}</Badge>
                  <IconButton label={t(language, "super.cat.editar")} variant="fantasma" onClick={() => openEditOption(option)}>
                    <PencilSimple size={20} weight="bold" />
                  </IconButton>
                  <IconButton label={t(language, option.active ? "super.cat.desactivar" : "super.cat.activar")} variant="fantasma" onClick={() => void toggleOption(option)}>
                    <Power size={20} weight="bold" />
                  </IconButton>
                </div>
              ))}
            </Card>
          ))}
          {options !== null && filteredOptions.length === 0 && <p className="text-body text-ink-suave">{t(language, "super.cat.sinResultados")}</p>}
        </div>
      ) : (
        <Card padding="sm" className="flex flex-col gap-1">
          {filteredItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-rosa-claro/60">
              <RowCheck selection={selection} id={item.id} label={tf(language, "sel.fila", { nombre: itemName(item, language) })} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-body font-bold">{itemName(item, language)}</p>
                <p className="truncate text-small font-semibold text-ink-suave">{item.id}</p>
              </div>
              <Badge tone={item.active ? "exito" : "aviso"}>{item.active ? t(language, "super.cat.activo") : t(language, "super.cat.inactivo")}</Badge>
              <IconButton label={t(language, "super.cat.editar")} variant="fantasma" onClick={() => openEditItem(item)}>
                <PencilSimple size={20} weight="bold" />
              </IconButton>
              <IconButton label={t(language, item.active ? "super.cat.desactivar" : "super.cat.activar")} variant="fantasma" onClick={() => void toggleItem(item)}>
                <Power size={20} weight="bold" />
              </IconButton>
            </div>
          ))}
          {items !== null && filteredItems.length === 0 && <p className="px-2 py-3 text-body text-ink-suave">{t(language, "super.cat.sinResultados")}</p>}
        </Card>
      )}

      <Dialog open={optionDraft !== null} onClose={() => setOptionDraft(null)} title={optionDialogTitle} closeLabel={t(language, "comun.cerrar")}>
        {optionDraft && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void saveOption();
            }}
          >
            <Field label={t(language, "super.cat.categoria")}>
              {(control) => (
                <Select {...control} value={optionDraft.category} onChange={(e) => setOptionDraft({ ...optionDraft, category: e.target.value as OptionCategory })} disabled={optionDraft.id !== null}>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {t(language, `super.cat.cat.${category}`)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t(language, "super.cat.valor")} hint={t(language, "super.cat.valorAyuda")}>
              {(control) => (
                <Input
                  {...control}
                  value={optionDraft.value}
                  onChange={(e) => setOptionDraft({ ...optionDraft, value: e.target.value.toUpperCase() })}
                  disabled={optionDraft.id !== null}
                  placeholder="NECK"
                />
              )}
            </Field>
            {(["en", "es", "zh"] as const).map((code) => (
              <Field key={code} label={t(language, `super.cat.${code}`)}>
                {(control) => (
                  <Input
                    {...control}
                    value={optionDraft[code]}
                    onChange={(e) => setOptionDraft({ ...optionDraft, [code]: e.target.value })}
                  />
                )}
              </Field>
            ))}
            <Field label={t(language, "super.cat.orden")}>
              {(control) => (
                <Input {...control} inputMode="numeric" value={optionDraft.sort} onChange={(e) => setOptionDraft({ ...optionDraft, sort: e.target.value.replace(/\D/g, "") })} />
              )}
            </Field>
            {(optionDraft.category === "objective" || optionDraft.category === "goal_phase" || optionDraft.meta) && (
              <Field label={t(language, "catalogo.meta")} hint={t(language, "catalogo.metaAyuda")}>
                {(control) => (
                  <Input
                    {...control}
                    spellCheck={false}
                    className="font-mono text-small"
                    value={optionDraft.meta}
                    placeholder={optionDraft.category === "goal_phase" ? '{"calorie_factor": 1.0}' : '{"sets": 3, "reps": 10, "rest_compound": 120, "rest_iso": 75}'}
                    onChange={(e) => setOptionDraft({ ...optionDraft, meta: e.target.value })}
                  />
                )}
              </Field>
            )}
            {error && <p role="alert" className="text-small font-bold text-peligro">{error}</p>}
            <Button type="submit" loading={busy} fullWidth>
              {t(language, "super.cat.guardar")}
            </Button>
          </form>
        )}
      </Dialog>

      <Dialog open={catalogDraft !== null} onClose={() => setCatalogDraft(null)}
        title={t(language, catalogDraft?.id ? "super.cat.editar" : "super.cat.nuevoItem")}
        closeLabel={t(language, "comun.cerrar")}
        footer={catalogDraft ? (
          <Button type="submit" form="catalog-item-form" loading={busy} fullWidth>
            {t(language, "super.cat.guardar")}
          </Button>
        ) : undefined}>
        {catalogDraft && (
          <CatalogItemForm key={catalogDraft.kind + ":" + (catalogDraft.id ?? "")}
            kind={catalogDraft.kind} initial={catalogDraft.payload} editing={catalogDraft.id !== null}
            language={language} error={error} onSave={saveCatalog} />
        )}
      </Dialog>
    </section>
  );
}

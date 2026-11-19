"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, TextArea } from "@/components/ui/Field";
import { getCatalog, type CatalogKind, type OptionItem } from "@/lib/api";
import type { Language } from "@/lib/i18n";
import { equipmentKeyOf, useOptions } from "@/lib/options";

type Payload = Record<string, unknown>;
type Label = readonly [string, string, string];
type Definition = {
  key: string;
  label: Label;
  type?: "localized" | "list" | "choices" | "select" | "number" | "boolean";
  required?: boolean;
  values?: readonly string[];
  group?: "muscles" | "equipment" | "objectives" | "exercises";
  initial?: string;
};

const languages = ["en", "es", "zh"] as const;
const choiceLabels: Record<string, Label> = {
  FREE_WEIGHT: ["Peso libre", "Free weight", "自由重量"], MACHINE: ["Máquina", "Machine", "器械"],
  SMITH: ["Máquina Smith", "Smith machine", "史密斯机"], CABLE: ["Polea", "Cable", "绳索"],
  BODYWEIGHT: ["Peso corporal", "Bodyweight", "自重"], ASSISTED: ["Asistido", "Assisted", "辅助"],
  BAND: ["Banda", "Band", "弹力带"], NONE: ["Ninguno", "None", "无"],
  KG: ["kg", "kg", "千克"], LB: ["lb", "lb", "磅"],
  LOW: ["Bajo", "Low", "低"], MEDIUM: ["Medio", "Medium", "中"], HIGH: ["Alto", "High", "高"],
  WARMUP: ["Calentamiento", "Warm-up", "热身"], ACTIVATION: ["Activación", "Activation", "激活"],
  MAIN: ["Principal", "Main", "主要"], ANY: ["Cualquiera", "Any", "不限"],
  MENSTRUAL_CYCLE: ["Ciclo menstrual", "Menstrual cycle", "月经周期"], GESTATIONAL: ["Embarazo", "Pregnancy", "孕期"],
  VITAMIN: ["Vitamina", "Vitamin", "维生素"], MINERAL: ["Mineral", "Mineral", "矿物质"],
  PROTEIN: ["Proteína", "Protein", "蛋白质"], OMEGA3: ["Omega 3", "Omega-3", "欧米伽3"],
  CAFFEINE: ["Cafeína", "Caffeine", "咖啡因"], CREATINE: ["Creatina", "Creatine", "肌酸"],
  IRON: ["Hierro", "Iron", "铁"], FOLATE: ["Folato", "Folate", "叶酸"],
  CALCIUM: ["Calcio", "Calcium", "钙"], FIBER: ["Fibra", "Fiber", "膳食纤维"], OTHER: ["Otro", "Other", "其他"],
  DAILY: ["A diario", "Daily", "每天"], PRE_WORKOUT: ["Antes de entrenar", "Before training", "训练前"],
  POST_WORKOUT: ["Después de entrenar", "After training", "训练后"], AS_NEEDED: ["Según necesidad", "As needed", "按需"],
  SAFE: ["Seguro", "Safe", "安全"], CAUTION: ["Precaución", "Caution", "慎用"], AVOID: ["Evitar", "Avoid", "避免"],
};
const impact = ["LOW", "MEDIUM", "HIGH"];
const safety = ["SAFE", "CAUTION", "AVOID"];

const equipmentTypes = ["FREE_WEIGHT", "MACHINE", "SMITH", "CABLE", "BODYWEIGHT", "ASSISTED", "BAND", "NONE"];

const fields: Record<CatalogKind, Definition[]> = {
  machine: [
    { key: "type", label: ["Tipo de equipo", "Equipment type", "器材类型"], type: "select", values: equipmentTypes, initial: "MACHINE", required: true },
    { key: "weight_factor", label: ["Factor de carga", "Load factor", "负重系数"], type: "number", initial: "1", required: true },
    { key: "unit", label: ["Unidad de peso", "Weight unit", "重量单位"], type: "select", values: ["KG", "LB"], initial: "KG" },
    { key: "exercises", label: ["Ejercicios asociados", "Associated exercises", "关联动作"], type: "choices", group: "exercises" },
    { key: "image_url", label: ["URL de imagen", "Image URL", "图片链接"] },
    { key: "notes", label: ["Notas", "Notes", "备注"], type: "localized", required: true },
  ],
  exercise: [
    { key: "description", label: ["Descripción", "Description", "描述"], type: "localized", required: true },
    { key: "muscle_groups", label: ["Grupos musculares", "Muscle groups", "肌群"], type: "choices", group: "muscles", required: true },
    { key: "equipment", label: ["Equipo principal", "Main equipment", "主要器材"], type: "select", group: "equipment", required: true },
    { key: "required_equipment", label: ["Equipo adicional requerido", "Required equipment", "所需器材"], type: "choices", group: "equipment" },
    { key: "equipment_type", label: ["Tipo de equipo", "Equipment type", "器材类型"], type: "select", values: equipmentTypes },
    { key: "impact", label: ["Impacto", "Impact", "冲击程度"], type: "select", values: impact, required: true },
    { key: "role", label: ["Función en la rutina", "Routine role", "训练角色"], type: "select", values: ["WARMUP", "ACTIVATION", "MAIN"], initial: "MAIN", required: true },
    { key: "image_url", label: ["URL de imagen", "Image URL", "图片链接"], required: true },
    { key: "media_url", label: ["URL de video", "Video URL", "视频链接"] },
    { key: "movement_pattern", label: ["Patrón de movimiento", "Movement pattern", "动作模式"] },
    { key: "variant_of", label: ["ID del ejercicio base", "Base exercise ID", "基础动作 ID"] },
    { key: "compound", label: ["Ejercicio compuesto", "Compound exercise", "复合动作"], type: "boolean" },
    { key: "supine", label: ["Se realiza boca arriba", "Performed lying face up", "仰卧动作"], type: "boolean" },
    { key: "setup", label: ["Preparación", "Setup", "准备"], type: "localized" },
    { key: "how_to", label: ["Instrucciones", "Instructions", "动作说明"], type: "localized" },
    { key: "pregnancy_tip", label: ["Nota para el embarazo", "Pregnancy note", "孕期提示"], type: "localized" },
  ],
  symptom: [
    { key: "modality", label: ["Contexto", "Context", "适用情境"], type: "select", values: ["ANY", "MENSTRUAL_CYCLE", "GESTATIONAL"], initial: "ANY", required: true },
    { key: "impact_cap", label: ["Impacto máximo", "Maximum impact", "最大冲击程度"], type: "select", values: impact },
    { key: "avoid_keywords", label: ["Palabras clave a evitar", "Keywords to avoid", "需避免的关键词"], type: "list" },
    { key: "avoid_patterns", label: ["Patrones a evitar", "Patterns to avoid", "需避免的动作模式"], type: "list" },
    { key: "block_training", label: ["Bloquear el entrenamiento", "Block training", "阻止训练"], type: "boolean" },
    { key: "advice", label: ["Recomendación", "Advice", "建议"], type: "localized" },
  ],
  supplement: [
    { key: "category", label: ["Categoría", "Category", "类别"], type: "select", required: true, values: ["VITAMIN", "MINERAL", "PROTEIN", "OMEGA3", "CAFFEINE", "CREATINE", "IRON", "FOLATE", "CALCIUM", "FIBER", "ELECTROLYTES", "OTHER"] },
    { key: "dosage", label: ["Porción", "Serving", "用量"], type: "localized", required: true },
    { key: "frequency", label: ["Frecuencia", "Frequency", "频率"], type: "select", values: ["DAILY", "PRE_WORKOUT", "POST_WORKOUT", "AS_NEEDED"] },
    { key: "is_daily", label: ["Uso diario", "Daily use", "每日使用"], type: "boolean" },
    { key: "safety_general", label: ["Seguridad general", "General safety", "一般安全性"], type: "select", values: safety, required: true },
    { key: "safety_pregnancy", label: ["Seguridad en embarazo", "Pregnancy safety", "孕期安全性"], type: "select", values: safety, required: true },
    { key: "objectives", label: ["Objetivos", "Goals", "目标"], type: "choices", group: "objectives" },
    { key: "brand_examples", label: ["Ejemplos de marcas", "Example brands", "品牌示例"], type: "list" },
    { key: "image_url", label: ["URL de imagen", "Image URL", "图片链接"] },
    { key: "notes", label: ["Notas", "Notes", "备注"], type: "localized", required: true },
  ],
};

const macros: Definition[] = [
  { key: "protein_g", label: ["Proteína (g)", "Protein (g)", "蛋白质（克）"], type: "number", required: true },
  { key: "carbs_g", label: ["Carbohidratos (g)", "Carbohydrates (g)", "碳水（克）"], type: "number", required: true },
  { key: "fat_g", label: ["Grasa (g)", "Fat (g)", "脂肪（克）"], type: "number", required: true },
  { key: "kcal", label: ["Energía (kcal)", "Energy (kcal)", "能量（千卡）"], type: "number", required: true },
];

const name: Definition = { key: "name", label: ["Nombre", "Name", "名称"], type: "localized", required: true };

function caption(label: Label, language: Language) {
  return label[language === "ES" ? 0 : language === "EN" ? 1 : 2];
}

function object(value: unknown): Payload {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Payload : {};
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readText(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function readLocalized(form: FormData, key: string, original: unknown) {
  const text: Payload = typeof original === "string" ? { en: original } : { ...object(original) };
  for (const code of languages) {
    if (!form.has(key + "." + code)) continue;
    const value = readText(form, key + "." + code);
    if (value) text[code] = value;
    else delete text[code];
  }
  const fallback = languages.map((code) => text[code]).find(Boolean);
  if (!fallback) return null;
  if (!text.en) text.en = fallback;
  return text;
}

function readField(form: FormData, field: Definition, original: unknown) {
  const value = readText(form, field.key);
  switch (field.type) {
    case "localized": return readLocalized(form, field.key, original);
    case "list": return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    case "choices": return form.getAll(field.key).map(String);
    case "boolean": return form.has(field.key);
    case "number": return Number(value);
    default: return value || null;
  }
}

function LocalizedFields({ field, value, language }: { field: Definition; value: unknown; language: Language }) {
  const localized = typeof value === "string" ? { en: value } : object(value);
  const code = language.toLowerCase();
  const key = field.key + "." + code;
  const initial = String(localized[code] || localized.en || "");
  return (
    <Field key={key} label={caption(field.label, language)} required={field.required}>
      {(control) => field.key === "name"
        ? <Input {...control} name={key} pattern=".*\S.*" defaultValue={initial} />
        : <TextArea {...control} name={key} rows={2} defaultValue={initial} />}
    </Field>
  );
}

function CatalogField({ field, value, options, language }: {
  field: Definition;
  value: unknown;
  options: OptionItem[];
  language: Language;
}) {
  if (field.type === "localized") return <LocalizedFields field={field} value={value} language={language} />;
  const initial = String((value === undefined ? field.initial : value) ?? "");
  const label = caption(field.label, language);
  if (field.type === "boolean") {
    return <label className="flex min-h-11 cursor-pointer items-center gap-3 font-bold"><input type="checkbox" name={field.key} defaultChecked={value === true} className="size-5 accent-ink" />{label}</label>;
  }
  const selected = field.type === "choices" ? strings(value) : initial ? [initial] : [];
  const choices = new Map<string, string>(options.map((option) => [
    field.group === "equipment" ? equipmentKeyOf(option.value) : option.value,
    option.labels[language.toLowerCase()] ?? option.label,
  ]));
  for (const item of field.values ?? []) choices.set(item, caption(choiceLabels[item], language));
  for (const item of selected) if (!choices.has(item)) choices.set(item, item);
  const multiple = field.type === "choices";
  return (
    <Field label={label} required={field.required} hint={field.type === "list"
      ? caption(["Un valor por línea", "One value per line", "每行一个值"], language)
      : multiple ? caption(["Puedes seleccionar varios valores", "You can select multiple values", "可选择多个值"], language) : undefined}>
      {(control) => multiple
        ? <select {...control} name={field.key} multiple size={Math.max(2, Math.min(5, choices.size))}
            className="w-full rounded-campo border-2 border-linea bg-nube p-2 text-body text-ink" defaultValue={selected}>
            {Array.from(choices, ([key, text]) => <option key={key} value={key}>{text}</option>)}
          </select>
        : field.type === "select"
        ? <Select {...control} name={field.key} defaultValue={initial}>
            <option value="">{caption(["Seleccionar", "Select", "选择"], language)}</option>
            {Array.from(choices, ([key, text]) => <option key={key} value={key}>{text}</option>)}
          </Select>
        : field.type === "list"
          ? <TextArea {...control} name={field.key} rows={2} defaultValue={strings(value).join("\n")} />
          : <Input {...control} name={field.key} type={field.type === "number" ? "number" : "text"}
              min={field.type === "number" ? 0 : undefined} step={field.type === "number" ? "any" : undefined} defaultValue={initial} />}
    </Field>
  );
}

export function CatalogItemForm({ kind, initial, editing, language, error, onSave }: {
  kind: CatalogKind;
  initial: Payload;
  editing: boolean;
  language: Language;
  error: string | null;
  onSave: (payload: Payload) => Promise<void>;
}) {
  const options = useOptions();
  const [exercises, setExercises] = useState<OptionItem[]>([]);
  const [exerciseError, setExerciseError] = useState(false);
  const [exerciseAttempt, setExerciseAttempt] = useState(0);

  useEffect(() => {
    if (kind !== "machine") return;
    let cancelled = false;
    setExerciseError(false);
    getCatalog(language).then((items) => {
      if (!cancelled) setExercises(items.map((item) => ({ value: item.id, label: item.name, labels: {} })));
    }).catch(() => {
      if (!cancelled) setExerciseError(true);
    });
    return () => { cancelled = true; };
  }, [kind, language, exerciseAttempt]);

  const available = {
    exercises,
    muscles: [...options.list("muscle_group_isolated"), ...options.list("muscle_group_general")],
    equipment: options.list("equipment"),
    objectives: options.list("objective"),
  };
  const [tips, setTips] = useState(() => (Array.isArray(initial.tips) ? initial.tips : []).map((value, id) => ({ id, value })));
  const [nextTip, setNextTip] = useState(tips.length);
  const definitions = [name, ...fields[kind]];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = { ...initial, id: readText(form, "id") } as Payload;
    for (const field of definitions) {
      const value = readField(form, field, initial[field.key]);
      if (kind === "symptom" && value === null) delete payload[field.key];
      else payload[field.key] = value;
    }
    if (kind === "exercise") {
      payload.tips = tips.map((tip) => readLocalized(form, "tip." + tip.id, tip.value)).filter(Boolean);
    }
    if (kind === "supplement") {
      payload.macros = { ...object(initial.macros), ...Object.fromEntries(
        macros.map((field) => [field.key, readField(form, field, undefined)]),
      ) };
    }
    void onSave(payload);
  }

  return (
    <form id="catalog-item-form" onSubmit={submit} className="flex flex-col gap-4">
      <Field label={caption(["Identificador", "Identifier", "标识符"], language)} required>
        {(control) => <Input {...control} name="id" readOnly={editing}
          pattern=".*\S.*" defaultValue={String(initial.id ?? "")} />}
      </Field>
      {(kind === "exercise" || kind === "supplement") && options.failed && <Button type="button" onClick={options.retry}>
        {caption(["Reintentar carga de opciones", "Retry loading options", "重新加载选项"], language)}
      </Button>}
      {exerciseError && <Button type="button" onClick={() => setExerciseAttempt((attempt) => attempt + 1)}>
        {caption(["Reintentar carga de ejercicios", "Retry loading exercises", "重新加载动作"], language)}
      </Button>}
      {definitions.map((field) => <CatalogField key={field.key} field={field} value={initial[field.key]}
        options={field.group ? available[field.group] : []} language={language} />)}
      {kind === "supplement" && (
        <fieldset className="rounded-ficha border border-linea px-4 pb-4">
          <legend className="px-2 font-bold">{caption(["Datos por porción", "Nutrition per serving", "每份营养"], language)}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {macros.map((field) => <CatalogField key={field.key} field={field}
              value={object(initial.macros)[field.key]} options={[]} language={language} />)}
          </div>
        </fieldset>
      )}
      {kind === "exercise" && (
        <details open={tips.length > 0}>
          <summary className="cursor-pointer font-bold">{caption(["Consejos del ejercicio", "Exercise tips", "运动提示"], language)}</summary>
          <div className="mt-3 flex flex-col gap-3">
            {tips.map((tip, index) => (
              <div key={tip.id} className="space-y-2">
                <LocalizedFields field={{ key: "tip." + tip.id, label: ["Consejo " + (index + 1), "Tip " + (index + 1), "提示 " + (index + 1)] }}
                  value={tip.value} language={language} />
                <Button type="button" variant="fantasma" onClick={() => setTips((current) => current.filter((item) => item.id !== tip.id))}>
                  {caption(["Quitar consejo", "Remove tip", "移除提示"], language)}
                </Button>
              </div>
            ))}
            <Button type="button" variant="suave" onClick={() => {
              setTips((current) => [...current, { id: nextTip, value: {} }]);
              setNextTip(nextTip + 1);
            }}>{caption(["Agregar consejo", "Add tip", "添加提示"], language)}</Button>
          </div>
        </details>
      )}
      {error && <p role="alert" className="text-small font-bold text-peligro">{error}</p>}
    </form>
  );
}


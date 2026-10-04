# DESIGN_SYSTEM.md — SyncFit Edge

Referencia oficial de diseño del frontend. Toda pantalla, sección o componente
nuevo sigue este archivo. Los valores viven en código en `app/tokens.css`
(Tailwind 4 `@theme`) y `lib/motion.ts`; la vitrina viva está en **`/ui`**.
Los mockups aprobados están en Claude Design ("SyncFit Edge — Rediseño").

---

## 1. Project overview

- **Producto:** SyncFit Edge — prescripción de entrenamiento adaptada a la fase del
  ciclo menstrual o a la semana de embarazo.
- **Tipo:** landing pública + app web de la atleta + paneles de administración.
- **Surface profile:** híbrido — *Landing/Marketing* (`/`), *App/Product UI*
  (`/app/*`, `/bienvenida`, `/entrar`), *Dashboard/Admin* (`/gym`, `/admin`).
- **Plataforma:** web (Next.js 16, React 19, TypeScript estricto), mobile-first.
- **Usuarias:** atleta en el gimnasio con el celular en la mano (principal);
  admin de gimnasio; super admin; entrenador/a con enlace de solo lectura.
- **Objetivo de diseño:** que una rutina segura y entendible esté a un toque, que
  lo que el cuerpo dice (fase, energía) se vea sin leer, y que el producto sea
  vistoso y memorable para el jurado.

## 2. Brand direction

- **Estilo visual:** playful / cartoon suave — cielo de algodón de azúcar, tinta
  índigo, nubes y goteos.
- **Mood & tone:** cálido, cercano, tranquilo; responsable con la salud.
- **Personalidad:** amiga que sabe de entrenamiento: juguetona en la forma,
  precisa en el fondo.
- **Concepto:** **"Tu cuerpo pone el clima."** El cielo de la app toma el color de
  la fase (menstrual coral, folicular menta, ovulatoria sol, lútea lavanda,
  gestación durazno) y **Pulsi** —una gota-corazón con cara— refleja el estado de
  la atleta (feliz, cansada, alerta, dormida). Se expresa en layout (nubes,
  tarjetas-nube, divisores que gotean), color (cielo por fase con `data-fase`),
  movimiento (flotar, respirar, cascada) e ilustración (Pulsi).
- **Revisión adversarial:** tapando el nombre, la combinación cielo-por-fase +
  Pulsi + goteos no describe a Flo, Clue ni a un gimnasio genérico. Debilidad
  encontrada: los botones primarios usaban sombra dura sin desenfoque (disfraz
  neobrutalista ajeno al mundo) → se cambió por `shadow-boton` con blur. La curva
  "rebote" se eliminó (el detector de impeccable la marcó).
- **Referencias:**
  - **paranice.co** — fondo rosa `#F1CCDE`, tinta índigo `#2A1D65`, tipografía
    redonda y pesada, menú de nubes, divisores derretidos, mascotas con cara y
    bocadillos.
  - **Flo** — círculo del ciclo en Hoy, tira semanal, registro en hoja inferior
    con chips, insights cortos, una acción principal por pantalla.
  - **Headspace** — personaje guía simple, sesiones guiadas con play grande,
    respiración, celebraciones suaves, saludo según la hora.
  - **ui-ux-pro-max** — confirmó Fredoka + Nunito y "Soft UI" (sombras suaves,
    contraste medido); su paleta fucsia/violeta se descartó por ser la típica del
    sector.
- **Voz y copy:** español cercano ("Escanear y crear rutina", "Registrar cómo me
  siento"). Un verbo por intención. Siempre se explica el porqué de un bloqueo o
  ajuste. Errores: qué pasó + cómo seguir ("Revisa tu conexión e inténtalo de
  nuevo"). Vacíos: Pulsi + la siguiente acción. Aclaración médica en el pie: no
  reemplaza a médico ni entrenador. Sin cifras ni testimonios inventados; los
  datos de ejemplo se marcan como tales.

## 3. Color system

Estrategia: **Full palette** con roles fijos. Todos los pares de texto verificados
por cálculo WCAG (34 pares, 0 fallos).

| Rol | Token | Hex | OKLCH | Uso |
|---|---|---|---|---|
| 60 % dominante | `rosa` | `#F1CCDE` | 88.2% 0.048 347 | fondo de página (el cielo) |
| 30 % secundario | `nube` | `#FFFAFC` | 98.9% 0.006 351 | tarjetas, hojas, inputs |
| 30 % secundario | `crema` | `#F4E1C1` | 91.7% 0.047 81 | secciones cálidas, acentos sobre oscuro |
| 30 % secundario | `rosa-claro` | `#F7E4EE` | 93.7% 0.024 344 | chips, botones suaves |
| 10 % acento / texto | `ink` | `#2A1D65` | 29.7% 0.120 285 | texto, botón primario, foco |
| hover / pressed | `ink-claro` / `ink-hondo` | `#3A2C80` / `#1C1247` | | estados del primario |
| texto secundario | `ink-suave` | `#4A3D85` | 41.2% 0.116 289 | metadatos (6.3:1 sobre rosa) |
| líneas UI | `linea` | `#8478B5` | 60.8% 0.092 293 | borde de inputs (3.8:1) |
| secciones hondas | `lavanda` | `#5E5290` | 47.9% 0.098 291 | bandas con texto claro |
| superficies sobre ink | `lavanda-noche` | `#3B2E80` | | entreno guiado |
| texto sobre oscuro | `lavanda-texto` | `#E9E2FF` | | cuerpo sobre lavanda/ink |
| fase menstrual | `menstrual` / `-suave` | `#F08A7E` / `#FBD1CB` | 74.0% 0.126 28 | |
| fase folicular | `folicular` / `-suave` | `#8FD3B6` / `#D3F1E4` | 81.3% 0.080 166 | |
| fase ovulatoria | `ovulatoria` / `-suave` | `#F7C75C` / `#FCE6AE` | 85.2% 0.135 85 | |
| fase lútea | `lutea` / `-suave` | `#B9ACEB` / `#E3DCFA` | 77.8% 0.090 294 | |
| gestación | `gestacion` / `-suave` | `#F6B48A` / `#FDE1CF` | 82.2% 0.095 53 | trimestres |
| peligro | `peligro` / `-suave` | `#8A2A25` / `#FBE3E1` | | bloqueos, borrar (7.0:1) |
| éxito | `exito` / `-suave` | `#2E6E54` / `#D3F1E4` | | validado, tomado (5.0:1) |
| aviso | `aviso` / `-suave` | `#6B4E00` / `#FCE6AE` | | precaución (6.3:1) |

**Reglas de uso**
- **Fondos:** página `rosa`; tarjetas `nube`; secciones de énfasis `lavanda`,
  `crema` o `ink`. El "cielo" de una pantalla usa `bg-fase-suave`.
- **Fase dinámica:** `data-fase="OVULATORY"` (valores del backend: `MENSTRUAL`,
  `FOLLICULAR`, `OVULATORY`, `LUTEAL`, `TRIMESTER_1..3`) en un contenedor →
  utilidades `bg-fase`, `bg-fase-suave`, `text-fase`. Para SVG usar
  `FASE_COLOR` de `lib/fases.ts`.
- **Texto:** siempre `ink` o `ink-suave` sobre claros; `nube`, `crema` o
  `lavanda-texto` sobre `ink`/`lavanda`. Nunca texto sobre el color fuerte de fase
  que no sea `ink`.
- **Botones:** primario `ink`; secundario `nube`; suave `rosa-claro`; peligro
  `peligro-suave` + texto `peligro`.
- **Separación:** fondo + sombra suave. Bordes solo en inputs (`linea`) y anillos
  de foco.
- **Estado nunca solo por color:** siempre con icono o texto.
- **Modo oscuro:** no se entrega todavía. El entreno guiado usa una vista oscura
  propia (`ink` + `lavanda-noche`) por decisión de escena (concentración).
- **Transición:** la paleta por defecto de Tailwind sigue activa solo para no
  romper las pantallas antiguas mientras se migran; al terminar el rediseño se
  desactiva (`--color-*: initial`) para que solo existan estos tokens.

## 4. Typography system

- **Personalidad:** playful/cartoon suave (Move A) → display redondeada (Move B).
- **Pareja:** **Fredoka** (títulos, botones, números grandes; 500/600/700) +
  **Nunito** (texto; 400/600/700/800). Chino cae a PingFang SC / Noto Sans SC.
- **Por qué:** Fredoka es el pariente libre más cercano a la Filson Soft de
  Paranice (redonda, pesada, amable); Nunito tiene terminales redondeados y lee
  bien a 16–17 px en movimiento.
- **Escala (tokens `text-*`):**

| Paso | Tamaño | Interlineado | Uso |
|---|---|---|---|
| `display` | clamp(2.75rem → 5.75rem) | 0.98, −0.02em | hero de landing |
| `h1` | clamp(2rem → 3.25rem) | 1.05 | título de pantalla |
| `h2` | clamp(1.625rem → 2.5rem) | 1.1 | secciones |
| `h3` | 1.375rem (22 px) | 1.2 | tarjetas, diálogos |
| `body-lg` | 1.1875rem (19 px) | 1.55 | subtítulos, CTA grande |
| `body` | 1.0625rem (17 px) | 1.55 | texto base |
| `small` | 0.9375rem (15 px) | 1.45 | metadatos |
| `caption` | 0.8125rem (13 px) | 1.35 | etiquetas, días |
| `button` | 1.0625rem Fredoka 600 | 1.2 | botones |

- **Cuerpo:** 17 px; medida 60–75 caracteres; `text-wrap: balance` en títulos y
  `pretty` en párrafos. Números de datos con `tabular-nums`.
- **Responsive:** la escala fluida vive en los tokens; nunca recortar texto.

## 5. Layout system

- **Contenedores:** landing `max-w-6xl`/`max-w-5xl` con 16 px de margen en
  móvil (`px-4`), 32 px en escritorio; app móvil a ancho completo; paneles con
  menú lateral (`flex-wrap`: el menú baja en teléfono).
- **Espaciado:** escala de 4 px de Tailwind (múltiplos de 8 para bloques);
  secciones de landing 64–96 px; pantallas de app 16–20 px de margen.
- **Landing (orden):** nav de nubes → hero centrado → divisor que gotea → problema
  (lavanda) → fases (tarjetas) → cómo funciona: dos IAs y el validador (crema) +
  ejemplo de adaptación → gimnasios → CTA final + footer (ink).
- **CTA:** primario único "Crear mi rutina" (hero, mitad, cierre); secundario
  "Ver cómo funciona".
- **Hero:** editorial centrado; Pulsi con alitas + bocadillo como gesto
  memorable; cabe en `100svh` a 700–800 px de alto; titular ≤ 2 líneas.
- **App (flujos):** barra inferior de 5 ítems en móvil (Hoy, Rutina, Calendario,
  Suplementos, Perfil); barra lateral ≥ 1024 px. Registros rápidos en hoja
  inferior (`Dialog variant="sheet"`). Una acción primaria por pantalla.
- **Breakpoints:** 375 / 768 / 1024 / 1280.

## 6. Component system

Base: **componentes propios sobre Tailwind 4** (sin librería de UI de terceros) +
`<dialog>` nativo. Iconos Phosphor. Animación: Motion (app) y GSAP (landing).

| Componente | Archivo | Notas |
|---|---|---|
| `Button`, `ButtonLink`, `IconButton` | `components/ui/Button.tsx` | variantes primario/secundario/suave/peligro/fantasma; sm 44 / md 48 / lg 56 px; `loading` + `loadingLabel`; `IconButton` exige `label` |
| `Card` | `components/ui/Card.tsx` | tonos nube/crema/fase/fase-suave/rosa-claro/lavanda/tinta; `elevated`; nunca anidada |
| `Chip`, `Badge` | `components/ui/Chip.tsx` | chip = toggle con `aria-pressed`; badge = etiqueta estática |
| `Field`, `Input`, `Select`, `TextArea` | `components/ui/Field.tsx` | etiqueta arriba, ayuda/error abajo con `aria-describedby`; `requiredText` localizado |
| `Dialog` | `components/ui/Dialog.tsx` | `variant="modal"` o `"sheet"` (hoja inferior en móvil) |
| `ToastProvider`, `useToast` | `components/ui/Toast.tsx` | exito/error/info con icono; error dura 7 s |
| `Skeleton`, `SkeletonGroup`, `EmptyState`, `ProgressBar` | `components/ui/States.tsx` | estados de carga / vacío / progreso |
| `Spinner` | `components/ui/Spinner.tsx` | siempre junto a un texto |
| `StoryCard` | `components/ui/StoryCard.tsx` | "por qué hoy" en lenguaje simple |
| `Pulsi` | `components/mascot/Pulsi.tsx` | `mood`, `color` (por defecto la fase), `wings`, `animated`, `title` |
| `moodFromDecision` | `components/mascot/mood.ts` | alertas → alerta; fatiga alta o `k_load < 0.85` → cansada |
| `CycleRing` | `components/cycle/CycleRing.tsx` | arcos por fase + marcador de hoy |
| `WeekStrip` | `components/cycle/WeekStrip.tsx` | 7 días con punto de fase |
| `Cloud`, `DripDivider` | `components/decor/` | decoración `aria-hidden` |
| `Choice` | `components/ui/Choice.tsx` | elección única sobre radios nativos: `tarjetas`, `pildoras` o `segmentado` |
| `PasswordInput` | `components/ui/PasswordInput.tsx` | mostrar/ocultar con etiqueta localizada |
| `NumberStepper` | `components/ui/NumberStepper.tsx` | número grande con − / + (ciclo, semanas) |
| `LanguageSwitcher` | `components/ui/LanguageSwitcher.tsx` | ES · EN · 中文, recordado en la sesión |
| `MonthPicker` | `components/cycle/MonthPicker.tsx` | calendario mensual; flechas, PageUp/PageDown, tinte de días de regla |
| `SpeechBubble` | `components/mascot/SpeechBubble.tsx` | bocadillo de Pulsi (tinta o nube) |
| `Wordmark`, `SkyShell` | `components/brand/` | logo + cielo con nubes para pantallas de acceso y onboarding |
| `Guard`, `LoadingScreen` | `components/session/` | guardas por rol; Pulsi respirando mientras carga la sesión |

Nav, footer, barra inferior y barra lateral se construyen en la fase 3 sobre
estas piezas.

**Patrones de flujo (fase 2):**
- *Acceso* (`/entrar`): cielo + Pulsi con bocadillo, control segmentado
  Entrar / Crear cuenta, tarjeta con el formulario. Validación al salir del
  campo; los errores del servidor se traducen (`lib/auth-errors.ts`) y se
  muestran junto al campo culpable con foco en él.
- *Onboarding* (`/bienvenida`): una pregunta por pantalla, barra de progreso,
  Pulsi con un bocadillo que explica para qué sirve el dato, transición
  lateral de 200 ms (sin desplazamiento con movimiento reducido) y una
  pantalla final cuyo cielo toma el color de la fase calculada.

## 7. Card & section style

- **Estilo:** tarjetas redondeadas sin borde ("nubes").
- **Radios:** `rounded-campo` 16 px (inputs), `rounded-ficha` 24 px (tiles),
  `rounded-nube` 32 px (tarjetas, diálogos), `rounded-cielo` 48 px (secciones),
  `rounded-full` botones y chips.
- **Sombras:** `shadow-nube` (tarjeta flotante), `shadow-boton` (primario),
  `shadow-flotante` (barra inferior), `shadow-dialogo`. Siempre con desplazamiento
  y desenfoque, teñidas de índigo.
- **Gradientes:** ninguno. **Glass:** ninguno.
- **Regla:** una jerarquía de elevación (página → tarjeta → flotante); nada de
  tarjeta dentro de tarjeta.

## 8. Icon system

- **Librería:** Phosphor (`@phosphor-icons/react`), peso **bold**, una sola
  familia (los iconos SVG del front anterior se retiran al migrar cada pantalla).
- **Tamaño:** 18–20 px en controles, 22–26 px en tarjetas.
- **Color:** `currentColor`.
- **Reglas:** botones solo-icono con `label`; nunca emoji como icono.

## 9. Image & asset rules

- **Logo:** wordmark "syncfit" en Fredoka 700 + Pulsi pequeño (SVG en código).
- **Ilustración:** Pulsi y decoraciones en SVG propio, trazo índigo 4–5 px,
  rellenos planos de la paleta.
- **Fotos de máquinas / perfil:** subidas por usuarias, comprimidas a data URL
  (`fileToDataUrl`); recorte `object-cover`, radio `rounded-ficha`, siempre con
  `width`/`height` o `aspect-ratio`.
- **Stock / IA:** no se usan.

## 10. Animation & interaction system

- **Librerías:** CSS para lo básico, **Motion** para micro-interacciones de la app
  (cascada, cambios de layout), **GSAP + ScrollTrigger** solo en la landing (carga
  diferida, fase 5).
- **Tokens:** `--ease-salida` (0.22, 1, 0.36, 1), `--ease-entrada`; duraciones
  `--dur-toque` 120 ms, `--dur-ui` 200 ms, `--dur-panel` 300 ms (espejo en
  `lib/motion.ts`). Solo `transform`/`opacity`.
- **Animaciones con nombre:** `animate-flotar` (Pulsi y nubes), `animate-parpadeo`
  (ojos), `animate-respirar` (escaneo/calentamiento), `animate-girar` (spinner),
  `animate-aparecer` (toasts, modal), `animate-subir` (hoja inferior).
- **Pulsación:** todo lo tocable baja a `scale(0.97)` (chips 0.95, icon 0.94).
- **Hover:** cambio de fondo inmediato (sin transición de color).
- **Cursor:** `pointer` en botones, `summary` y `label[for]`.
- **Estados:** default / hover / `:focus-visible` (anillo `ink` de 3 px, `crema`
  dentro de `.sobre-oscuro`) / active / disabled (50 %).
- **Async:** el botón muestra spinner + verbo ("Guardando…"); el resultado llega
  con toast de éxito o error.
- **Formularios:** validación al salir del campo, error debajo con icono y
  `role="alert"`.
- **Vistas de datos:** skeleton al cargar, `EmptyState` con Pulsi, error con
  reintento.
- **Movimiento reducido:** `prefers-reduced-motion` anula animaciones y
  transiciones (todo queda visible y estático).
- **Rendimiento (objetivo CWV: LCP < 2.5 s, CLS < 0.1, INP < 200 ms):** fuentes
  con `next/font` (`display: swap`, autoalojadas), SVG en línea, rutas
  separadas, GSAP solo en la landing y con import dinámico, imágenes con medidas.

## 11. Accessibility rules

- **Contraste:** calculado (script de verificación, 34 pares AA, 0 fallos);
  texto ≥ 4.5:1, UI ≥ 3:1.
- **Foco:** `:focus-visible` en todo lo interactivo; nunca se quita sin
  reemplazo. Los diálogos se enfocan a sí mismos al abrir para no mostrar un
  anillo tras un clic.
- **Teclado:** `<dialog>` nativo (trampa de foco, Escape, devuelve el foco).
- **Semántica:** `button`/`a` reales, `aria-pressed` en chips y días,
  `role="progressbar"`, `role="img"` + `aria-label` en el anillo del ciclo.
- **Objetivos táctiles:** ≥ 44 px.
- **Idiomas:** EN/ES/ZH; dejar espacio para expansión del texto.
- Nunca solo color: estado + icono o texto.

## 12. Anti-AI-slop rules

El gate contable vive en la skill ui-ux-kit (`SKILL.md` → Pre-flight check) y en
el detector de impeccable (`impeccable detect`). Decisiones propias del proyecto:

- **Paleta aprobada:** solo los tokens de §3.
- **`#000`/`#fff` puro:** no; el blanco es `nube` `#FFFAFC`.
- **Veredicto del concepto:** distintivo (ver §2).
- **Excepciones deliberadas:** la paleta rosa + índigo podría parecer "femtech
  de manual", pero es una referencia vinculante del equipo (Paranice), no un
  reflejo; la diferenciación viene del cielo por fase, Pulsi y los goteos.
  Sin eyebrows/kickers sobre títulos.

## 13. Future page instructions

Toda pantalla nueva reutiliza estos colores, tipografía, espaciado, componentes,
iconos, tarjetas, animaciones e ilustraciones. No se introduce un estilo nuevo
sin actualizar este archivo.

## 14. Update policy

Si cambian colores, tipografía, componentes, animaciones, tarjetas, iconos o
ilustración, se actualiza este archivo (y `app/tokens.css`) en el mismo PR.

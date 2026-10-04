# Inventario de funcionalidades (no perder nada)

Checklist del rediseño. Cada función de `lib/api.ts` y cada comportamiento de la
interfaz anterior (`app/page.tsx`, `components/*`) tiene asignada una pantalla
nueva. Una casilla se marca solo cuando ya funciona en la pantalla nueva y se
probó contra el backend local.

Rutas nuevas: `/` landing · `/entrar` · `/bienvenida` · `/app` (Hoy) ·
`/app/rutina` · `/app/entreno` · `/app/calendario` · `/app/nutricion` ·
`/app/gimnasios` · `/app/perfil` · `/app/explorar` · `/gym` · `/admin` ·
`/compartido/[token]`.

## 1. Cliente del API (`lib/api.ts`)

| Función | Endpoint | Hoy se usa en | Pantalla nueva | ✓ |
|---|---|---|---|---|
| `register` | `POST /auth/register` | AuthPanel (retirado) | `/entrar` | ☑ |
| `login` | `POST /auth/login` | AuthPanel (retirado) | `/entrar` | ☑ |
| `getMe` | `GET /auth/me` | page (sesión) | `SessionProvider` + guardas | ☑ |
| `getToken` / `setToken` / `logoutLocal` | — (localStorage) | page | `SessionProvider` (`signOut`) | ☑ |
| `getMyProfile` | `GET /profiles/me` | page | `SessionProvider` (sin perfil → `/bienvenida`) | ☑ |
| `updateMyProfile` | `PUT /profiles/me` | onboarding, perfil, síntomas, máquinas, suplementos | `/bienvenida`, Hoy, `/app/perfil`, `/app/gimnasios`, `/app/nutricion` | ☑ |
| `saveProfile` | `POST /profiles` (invitado/legacy) | sin uso real (el front anterior tenía una función local con el mismo nombre que llamaba a `PUT /profiles/me`) | — | — |
| `getCycle` | `GET /cycle` | sin uso | no hace falta: el anillo usa `profile.timeline` + calendario | — |
| `getCalendar` | `GET /calendar` | page | tira semanal y anillo de `/app`, `/app/calendario` | ☑ |
| `getStats` | `GET /stats` | page | `/app` (racha, metas semanales) | ☑ |
| `getSymptoms` | `GET /symptoms` | page | `/app` (hoja "cómo me siento") | ☑ |
| `getMuscleGroups` | `GET /muscle-groups` | sin uso (lista fija en el front) | `/app/rutina` usa las mismas listas fijas (`ISOLATED_GROUPS`, `GENERAL_GROUPS`) | — |
| `capture` | `POST /capture` | page ("Tomar datos") | `/app/rutina` (escaneo → rutina) | ☑ |
| `generateRoutine` | `POST /routines` | sin uso | modo demo para el jurado (opcional) | ☐ |
| `sendTelemetry` | `POST /telemetry` | sin uso | onda de pulso en vivo durante el escaneo (opcional) | ☐ |
| `getCatalog` | `GET /catalog` | page, AdminPanel | `/app/rutina` buscar en catálogo ☑ · `/gym` (ejercicios por máquina) | ☐ |
| `getExerciseAlternatives` | `GET /exercises/{id}/alternatives` | page (botón Cambiar) | `/app/rutina` (hoja "Cambiar") | ☑ |
| `getExerciseVariants` | `GET /exercises/{id}/variants` | ExerciseDetailModal | `/app/rutina` (detalle del ejercicio) | ☑ |
| `getMachines` | `GET /machines` | page (mis máquinas) | `/app/gimnasios` (mis máquinas), `/compartido` | ☑ |
| `joinGym` | `POST /gyms/join` | page | `/app/gimnasios` | ☑ |
| `getJoinedGyms` | `GET /gyms/joined` | page (refresco 15 s + foco) | `/app/gimnasios` (refresco 15 s + foco + visibilidad + botón), factor en el detalle de `/app/rutina` | ☑ |
| `leaveGym` | `DELETE /gyms/{id}/leave` | page | `/app/gimnasios` (con confirmación) | ☑ |
| `activateGym` | `POST /gyms/{id}/activate` | page | `/app/gimnasios` | ☑ |
| `getSupplements` | `GET /supplements` | page | `/app/nutricion` (sugeridos + macros diarios) | ☑ |
| `getSupplementCatalog` | `GET /supplements/catalog` | page | `/app/nutricion` (mis suplementos, agregar) | ☑ |
| `getSupplementIntakes` | `GET /supplement-intakes` | page | `/app/nutricion` | ☑ |
| `setSupplementIntake` | `POST /supplement-intakes` | page | `/app/nutricion` (marcar tomado) | ☑ |
| `createShare` | `POST /shares` | page | `/app/perfil` (compartir) | ☑ |
| `listShares` | `GET /shares` | page | `/app/perfil` | ☑ |
| `deleteShare` | `DELETE /shares/{token}` | page | `/app/perfil` (con confirmación) | ☑ |
| `getShared` | `GET /shared/{token}` | shared/[token] | `/compartido/[token]` (+ redirección desde `/shared/[token]`) | ☑ |
| `createGym` | `POST /gyms` | AdminPanel | `/gym` | ☐ |
| `listMyGyms` | `GET /gyms/mine` | AdminPanel | `/gym` | ☐ |
| `updateGym` | `PATCH /gyms/{id}` | AdminPanel | `/gym` | ☐ |
| `deleteGym` | `DELETE /gyms/{id}` | AdminPanel | `/gym` | ☐ |
| `addGymMachine` | `POST /gyms/{id}/machines` | AdminPanel | `/gym` | ☐ |
| `updateGymMachine` | `PATCH /gyms/{id}/machines/{mid}` | AdminPanel | `/gym` | ☐ |
| `deleteGymMachine` | `DELETE /gyms/{id}/machines/{mid}` | AdminPanel | `/gym` | ☐ |
| `fileToDataUrl` | — (compresión de imagen) | AdminPanel | foto de perfil `/app/perfil` ☑ (antes se subía sin comprimir) · `/gym` | ☐ |
| `fetchGymQr` | `GET /gyms/{id}/qr.png` | AdminPanel | `/gym` | ☐ |
| `createGymAdmin` | `POST /admin/gym-admins` | AdminPanel | `/admin` | ☐ |
| `listGymAdmins` | `GET /admin/gym-admins` | AdminPanel | `/admin` | ☐ |
| `listUsers` | `GET /admin/users` | UserConsole | `/admin` (buscar + filtrar por rol) | ☐ |
| `getUserDetail` | `GET /admin/users/{id}` | sin uso | `/admin` (detalle de usuaria) | ☐ |
| `updateUser` | `PATCH /admin/users/{id}` | UserConsole | `/admin` | ☐ |
| `setUserActive` | `POST /admin/users/{id}/activate\|deactivate` | UserConsole | `/admin` | ☐ |
| `resetUserPassword` | `POST /admin/users/{id}/password` | UserConsole | `/admin` | ☐ |
| `setUserRole` | `POST /admin/users/{id}/role` (pide contraseña admin) | UserConsole | `/admin` | ☐ |
| `deleteUser` | `DELETE /admin/users/{id}` (pide contraseña admin) | UserConsole | `/admin` | ☐ |
| `getHealth` | `GET /health` | sin uso | aviso "sin conexión con el servidor" (opcional) | ☐ |

Endpoints que el front anterior **no** usaba y ahora sí (fase 3d, `/app/perfil` → Cuenta):
`changePassword` → `PUT /auth/password` ☑ · `logoutEverywhere` → `POST /auth/logout` ☑ ·
`deleteAccount` → `DELETE /auth/me` ☑.

## 2. Comportamientos de la interfaz anterior

### Sesión y roles
- ☑ Login / registro con cédula (`document_id`) y errores 401/403/409/422/429 explicados (fase 2).
- ☑ Idioma EN / ES / ZH seleccionable, ES por defecto y recordado (fase 2).
- ☑ `SUPER_ADMIN` → `/admin`, `GYM_ADMIN` → `/gym`; nunca ven el flujo de atleta (fase 2).
- ☑ Sin perfil → `/bienvenida`: modalidad, altura, peso, % grasa, calorías diarias,
  objetivo, fase de objetivo, meta semanal de entrenos, días de descanso,
  fecha de última regla (FUM), duración del ciclo o semana de gestación (fase 2).
- ☑ Cerrar sesión (vuelve a `/entrar`) (fase 2).

### Rutina (`onTakeData` y edición) — fase 3b
- ☑ Elegir hasta 4 grupos musculares (aislados + generales); se recuerdan.
- ☑ Número de ejercicios principales, tiempo disponible (o sin límite), energía
  (con energía / normal / sin energía, prellenada desde Hoy), incluir calentamiento.
- ☑ Síntomas y dolor general: hoja "Registrar cómo me siento" en Hoy (fase 3a) y
  acceso directo desde Rutina; dolor **por síntoma** (0–10) y nota libre en `/app/perfil` (3d).
- ☑ Filtro por gimnasio unido (todos / uno) → `/app/gimnasios` (3d).
- ☑ Resultado: fase, fatiga, `k_load` ("Hoy al 82 % de tu carga"), RMSSD, alertas,
  minutos totales (recalculados al editar), motor usado, y "¿Por qué esta rutina?"
  (estado autonómico, riesgo articular, patrones evitados).
- ☑ Calentamiento separado de la rutina.
- ☑ Ejercicio bloqueado con motivo y sustituto.
- ☑ Editar series / reps / peso (`updateEntry`) — ahora el entreno usa la edición.
- ☑ Reemplazar desde el catálogo (`replaceEntry`) con buscador, quitar (`removeEntry`).
- ☑ Botón Cambiar → alternativas ordenadas, "En tu gym" (`openChange`, `applyAlternative`).
- ☑ Variantes de la familia de movimiento (`applyVariant`).
- ☑ Detalle: animación/foto (`ExerciseThumb`), máquina, series por tipo, peso estimado
  (`base × k_load × factor de máquina`), biomarcadores, patrón y `rationale`.

### Entreno (`WorkoutRunner`) — fase 3b
- ☑ Recorrido por pasos: calentamiento → series (WARMUP, ACTIVATION,
  APPROXIMATION, EFFECTIVE) con reps y peso; los bloqueados se omiten como antes.
- ☑ Temporizador de descanso con pausa, "saltar descanso" y +15 s.
- ☑ Marcar serie hecha (con vibración corta), peso usado, tiempo total, pantalla de rutina completada con racha.

### Suplementos → Nutrición (`/app/nutricion`) — fase 3c
- ☑ Objetivo y etapa editables (recalculan sugeridos y calorías).
- ☑ Macros diarios según objetivo y fase (barra de proporción con etiquetas).
- ☑ Mis suplementos actuales con macros por porción editables (`toggleCurrentSupplement`,
  `saveSupplementMacro`), quitar, aviso si no es apto en el embarazo.
- ☑ Sugeridos con seguridad SAFE / CAUTION / AVOID, motivo, dosis, marcas y macros; agregar desde la tarjeta.
- ☑ Marcar como tomado hoy (`toggleIntake`) con progreso "Tomaste n de m hoy" (fecha local).

### Gimnasios y máquinas → `/app/gimnasios` — fase 3d
- ☑ Unirse por código (error claro si no existe), salir (con confirmación), activar gimnasio.
- ☑ Ver máquinas de los gimnasios unidos agrupadas por gimnasio (foto, uso, factor de peso).
- ☑ Refresco automático al volver a la ventana, al hacerse visible y cada 15 s, más botón manual.
- ☑ "Mis máquinas" disponibles (`available_machines`) con buscador.

### Perfil → `/app/perfil` — fase 3d
- ☑ Datos, foto de perfil (ahora comprimida), objetivo/metas (meta semanal y descansos se leen de `/stats` porque `GET /profiles/me` no los devuelve).
- ☑ Registrar inicio del periodo, duración del ciclo o semana de embarazo (nuevo).
- ☑ Cargas base por ejercicio con unidad kg/lb (ahora convierte de verdad).
- ☑ Compartir: rol, permisos, nombre, crear, copiar, abrir, borrar.
- ☑ Idioma, cambiar contraseña, cerrar sesión, cerrar sesión en todos los dispositivos, borrar cuenta.

### Admin de gimnasio
- ☐ Crear / renombrar / borrar gimnasio (con confirmación).
- ☐ Código del gimnasio y QR.
- ☐ Máquinas: foto (subir / quitar), nombre, para qué sirve (traducción por IA),
  equipo, tipo, factor de peso, ejercicios que cubre (buscador del catálogo).

### Super admin
- ☐ Crear admin de gimnasio (correo, contraseña, nombre).
- ☐ Ver todos los gimnasios.
- ☐ Usuarios: buscar, filtrar por rol, editar, activar / desactivar, contraseña
  temporal, cambiar rol y borrar (ambos piden la contraseña del admin).

### Perfil compartido (público)
- ☑ Vista de solo lectura según los permisos del enlace → `/compartido/[token]` (nombres en vez de ids).

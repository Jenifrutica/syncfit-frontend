# Inventario de funcionalidades (no perder nada)

Checklist del rediseño. Cada función de `lib/api.ts` y cada comportamiento de la
interfaz anterior (`app/page.tsx`, `components/*`) tiene asignada una pantalla
nueva. Una casilla se marca solo cuando ya funciona en la pantalla nueva y se
probó contra el backend local.

Rutas nuevas: `/` landing · `/entrar` · `/bienvenida` · `/app` (Hoy) ·
`/app/rutina` · `/app/entreno` · `/app/calendario` · `/app/suplementos` ·
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
| `updateMyProfile` | `PUT /profiles/me` | onboarding, perfil, síntomas, máquinas, suplementos | `/bienvenida` ☑ · `/app` hoja "cómo me siento" ☑ · `/app/perfil`, `/app/gimnasios`, `/app/suplementos` | ☐ |
| `saveProfile` | `POST /profiles` (invitado/legacy) | page | `/app/perfil` (cargas base) | ☐ |
| `getCycle` | `GET /cycle` | sin uso | no hace falta: el anillo usa `profile.timeline` + calendario | — |
| `getCalendar` | `GET /calendar` | page | tira semanal y anillo de `/app` ☑ · `/app/calendario` | ☐ |
| `getStats` | `GET /stats` | page | `/app` (racha, metas semanales) | ☑ |
| `getSymptoms` | `GET /symptoms` | page | `/app` (hoja "cómo me siento") | ☑ |
| `getMuscleGroups` | `GET /muscle-groups` | sin uso (lista fija en el front) | `/app/rutina` usa las mismas listas fijas (`ISOLATED_GROUPS`, `GENERAL_GROUPS`) | — |
| `capture` | `POST /capture` | page ("Tomar datos") | `/app/rutina` (escaneo → rutina) | ☑ |
| `generateRoutine` | `POST /routines` | sin uso | modo demo para el jurado (opcional) | ☐ |
| `sendTelemetry` | `POST /telemetry` | sin uso | onda de pulso en vivo durante el escaneo (opcional) | ☐ |
| `getCatalog` | `GET /catalog` | page, AdminPanel | `/app/rutina` buscar en catálogo ☑ · `/gym` (ejercicios por máquina) | ☐ |
| `getExerciseAlternatives` | `GET /exercises/{id}/alternatives` | page (botón Cambiar) | `/app/rutina` (hoja "Cambiar") | ☑ |
| `getExerciseVariants` | `GET /exercises/{id}/variants` | ExerciseDetailModal | `/app/rutina` (detalle del ejercicio) | ☑ |
| `getMachines` | `GET /machines` | page (mis máquinas) | `/app/gimnasios` | ☐ |
| `joinGym` | `POST /gyms/join` | page | `/app/gimnasios` | ☐ |
| `getJoinedGyms` | `GET /gyms/joined` | page (refresco 15 s + foco) | factor de máquina en el detalle de `/app/rutina` ☑ · `/app/gimnasios` | ☐ |
| `leaveGym` | `DELETE /gyms/{id}/leave` | page | `/app/gimnasios` | ☐ |
| `activateGym` | `POST /gyms/{id}/activate` | page | `/app/gimnasios` | ☐ |
| `getSupplements` | `GET /supplements` | page | `/app/suplementos` (sugeridos + macros diarios) | ☐ |
| `getSupplementCatalog` | `GET /supplements/catalog` | page | `/app/suplementos` (mis suplementos) | ☐ |
| `getSupplementIntakes` | `GET /supplement-intakes` | page | `/app/suplementos` | ☐ |
| `setSupplementIntake` | `POST /supplement-intakes` | page | `/app/suplementos` (marcar tomado) | ☐ |
| `createShare` | `POST /shares` | page | `/app/perfil` (compartir) | ☐ |
| `listShares` | `GET /shares` | page | `/app/perfil` | ☐ |
| `deleteShare` | `DELETE /shares/{token}` | page | `/app/perfil` | ☐ |
| `getShared` | `GET /shared/{token}` | shared/[token] | `/compartido/[token]` (+ redirección desde `/shared/[token]`) | ☐ |
| `createGym` | `POST /gyms` | AdminPanel | `/gym` | ☐ |
| `listMyGyms` | `GET /gyms/mine` | AdminPanel | `/gym` | ☐ |
| `updateGym` | `PATCH /gyms/{id}` | AdminPanel | `/gym` | ☐ |
| `deleteGym` | `DELETE /gyms/{id}` | AdminPanel | `/gym` | ☐ |
| `addGymMachine` | `POST /gyms/{id}/machines` | AdminPanel | `/gym` | ☐ |
| `updateGymMachine` | `PATCH /gyms/{id}/machines/{mid}` | AdminPanel | `/gym` | ☐ |
| `deleteGymMachine` | `DELETE /gyms/{id}/machines/{mid}` | AdminPanel | `/gym` | ☐ |
| `fileToDataUrl` | — (compresión de imagen) | AdminPanel, foto de perfil | `/gym`, `/app/perfil` | ☐ |
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

Endpoints del backend que el front anterior **no** usaba y se pueden sumar en
`/app/perfil`: `PUT /auth/password` (cambiar contraseña), `POST /auth/logout`
(cerrar sesión en todos los dispositivos), `DELETE /auth/me` (borrar cuenta).

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
  acceso directo desde Rutina. El dolor **por síntoma** (1–10 por cada uno) y la
  nota libre de síntomas siguen en la versión anterior hasta la fase 3d (Perfil).
- ☐ Filtro por gimnasio unido (todos / uno) — era solo visual en "Mis máquinas"; pasa a `/app/gimnasios` (3d).
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

### Suplementos
- ☐ Macros diarios según objetivo y fase.
- ☐ Mis suplementos actuales con macros editables (`toggleCurrentSupplement`,
  `saveSupplementMacro`).
- ☐ Sugeridos con seguridad SAFE / CAUTION / AVOID, dosis y motivo.
- ☐ Marcar como tomado hoy (`toggleIntake`).

### Gimnasios y máquinas
- ☐ Unirse por código, salir, activar gimnasio.
- ☐ Ver máquinas de los gimnasios unidos agrupadas por gimnasio.
- ☐ Refresco automático al volver a la ventana, al entrar a la pestaña y cada 15 s,
  más botón manual.
- ☐ "Mis máquinas" disponibles (`available_machines`) con buscador.

### Perfil
- ☐ Datos, foto de perfil (`onPhoto`, comprimida), objetivo.
- ☐ Calendario del ciclo / gestación por mes.
- ☐ Racha y días de entreno de la semana (`getStats`).
- ☐ Cargas base por ejercicio (`myLoads`).
- ☐ Compartir: rol (entrenador, etc.), permisos, crear, copiar enlace, borrar.

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
- ☐ Vista de solo lectura según los permisos del enlace.

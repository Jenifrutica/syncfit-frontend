# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Atleta (principal):** mujer que entrena fuerza en un gimnasio. Llega al gym, se escanea en la estación de sensores (o con la pulsera) y sigue desde el celular la rutina adaptada a su fase del ciclo menstrual o a su semana de embarazo.
- **Admin de gimnasio:** crea su gimnasio, registra las máquinas reales (foto, ejercicios que cubre, factor de peso) y comparte el código/QR para que las atletas se unan.
- **Super admin:** gestiona usuarios, roles y admins de gimnasio.
- **Entrenador/a o acompañante:** solo ve el perfil de una atleta por un enlace de solo lectura que ella comparte.

## Product Purpose
SyncFit Edge adapta la prescripción de entrenamiento al estado fisiológico femenino real (fase menstrual o trimestre de gestación) para entrenar mejor y prevenir lesiones. Éxito = la atleta obtiene en segundos una rutina segura y entendible, la sigue en el gym y vuelve al día siguiente.

## Positioning
Los modelos de entrenamiento clásicos se basan en fisiología masculina. SyncFit mide biomarcadores (variabilidad cardiaca RMSSD, temperatura, pérdida de fuerza isométrica) y combina **dos IAs**: un modelo local determinista que calcula la carga (`k_load` 0.70–1.05) y DeepSeek que diseña la rutina con el equipo real del gimnasio; luego un validador determinista bloquea lo contraindicado (p. ej. ejercicios en supino desde la semana 16) y explica el motivo.

## Operating Context
- Uso en el gimnasio, de pie, con el celular en la mano entre series: necesita lectura rápida y botones grandes.
- Flujo: registro (con cédula) → onboarding (modalidad, fechas, cuerpo, objetivo) → unirse a un gimnasio por código → escanear → rutina → entrenar → registrar suplementos/síntomas → compartir.
- Backend FastAPI (`syncfit-backend`, ver `API.md`), auth JWT en `localStorage`, idiomas EN/ES/ZH.

## Capabilities and Constraints
- Toda la funcionalidad existente en `lib/api.ts` debe conservarse (ver `FEATURES.md`).
- Los cálculos numéricos nunca se hacen en el front; el front muestra `k_load`, fase, fatiga, alertas, bloqueos y `rationale` que llegan del backend.
- Next.js + TypeScript estricto obligatorio.

## Brand Commitments
- Nombre: **SyncFit Edge**.
- Referencias vinculantes del equipo: **paranice.co** (personalidad visual), **Flo** (facilidad de uso), **Headspace** (calidez, personajes).
- Voz: cercana y en español por defecto, pero responsable: aclara que no reemplaza el criterio médico y siempre explica por qué se bloquea o cambia un ejercicio.

## Evidence on Hand
- Proyecto académico evaluado por un jurado; datos del simulador (`syncfit-simulator`) y catálogo de ejercicios/suplementos del backend.
- **No hay** usuarias reales, testimonios, logos de clientes ni métricas de impacto: no inventarlos.

## Product Principles
1. Explicar antes que ordenar: cada adaptación muestra su porqué en lenguaje simple.
2. Una acción principal por pantalla; usable con una mano en el gym.
3. La seguridad gana: un bloqueo nunca se esconde.
4. Lo que el cuerpo dice (fase, energía) se ve sin tener que leer.

## Accessibility & Inclusion
WCAG 2.1 AA, objetivos táctiles ≥44 px, `prefers-reduced-motion`, i18n EN/ES/ZH (textos chinos más cortos y altos).

# SyncFit Frontend

Reactive analytical interface of SyncFit Edge for trainers and athletes. Built with TypeScript, Next.js, React and Tailwind CSS.

## Purpose

Make the adaptive prescription readable in real time: live waveforms, a dual-modality workflow, and a clear matrix of original versus adapted exercises.

## What belongs here

- **Dual-modality selector**: menstrual cycle or pregnancy, with the corresponding timeline.
- **Real-time visualization** (`components/viz/`): pulse wave and dynamometry rendered with HTML5 Canvas / D3.js.
- **Adaptive routine matrix**: original exercises, blocked exercises with reason, substitutes and adapted sets/reps/weight.
- **Telemetry client**: consumes the generated types and validators from [`syncfit-contracts`](../syncfit-contracts) and streams over WebSocket.
- Fully typed code, accessible components, responsive layout.

## What does NOT belong here

- Server logic, DSP, model training or AI prompts.

## Data Structures

| Structure | Complexity | Purpose |
|-----------|:----------:|---------|
| **Rolling Ring Buffer** | O(1) append | Fixed-length buffer feeding the real-time waveform canvas, keeping rendering smooth at high frequency. |

## Suggested structure

```
syncfit-frontend/
├── app/                # Next.js routes
├── components/
│   ├── viz/            # canvas / D3 real-time charts
│   └── routine/        # adaptive routine matrix
├── lib/                # WebSocket client, generated types
├── public/
├── package.json
└── README.md
```

## Stack

TypeScript, Next.js, React, Tailwind CSS, HTML5 Canvas, D3.js.

## Related repositories

- [`syncfit-contracts`](../syncfit-contracts) — generated types and WS protocol.
- [`syncfit-backend`](../syncfit-backend) — REST and WebSocket server.
- [`syncfit-simulator`](../syncfit-simulator) — mock telemetry during development.

All code, comments, documentation and commits in this repository are written in English.

# Dream House Builder

A web-based, local-first 3D house builder where you can construct and walk through your dream house. Built with React, Three.js, and TypeScript.

## Features

- **3D Building Tools** — Place pillars, walls, doors, windows, steel bars, roofs, furniture, and paint supported surfaces
- **First-Person Mode** — Press `V` to enter first-person view and walk through your creation with WASD + mouse look
- **Roblox-Style Character** — Third-person player character with WASD movement and camera follow
- **Foreman NPC** — A construction foreman who gives contextual tips via speech bubble
- **Guided Builder Flow** — A builder guide and contextual dialogue help users build step by step
- **Tool-Based Editing** — Click to place, select, paint, delete, and adjust objects on a snapping construction space
- **Undo Support** — `Ctrl+Z` to undo any action
- **Keyboard Shortcuts** — Tool hotkeys, delete, undo, UI toggle, and object nudging
- **Local Save/Load** — Persist your designs to localStorage
- **Material Selection** — Choose between wood and steel for structural elements

## Controls

| Key          | Action                                                                         |
| ------------ | ------------------------------------------------------------------------------ |
| `W A S D`    | Move character                                                                 |
| `V`          | Toggle first-person view                                                       |
| `1-9`        | Switch tools (tool mapping depends on current app bindings)                      |
| `H`          | Toggle UI toolbar                                                              |
| `Delete`     | Remove selected object                                                         |
| `Ctrl+Z`     | Undo                                                                           |
| `Arrow Keys` | Nudge selected object                                                          |
| `Esc`        | Deselect / exit first-person                                                   |

## Tech Stack

- **React 19** + TypeScript
- **Three.js** for 3D rendering
- **Vite** for dev/build tooling
- LocalStorage for persistence

Legacy Konva/2D code still exists in the repo, but the active product direction is the 3D-first builder.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── canvas/        # Legacy 2D canvas components
│   ├── layout/        # Floating tools, guide, and HUD
│   └── three/         # 3D view wrapper
├── constants/         # Editor & scene config
├── hooks/             # Custom React hooks
├── renderer3d/        # Three.js renderer modules
│   ├── worldRenderer.ts       # Main renderer orchestrator
│   ├── worldMeshBuilder.ts    # 3D world mesh construction
│   ├── playerCharacter.ts     # Player and foreman NPC
│   └── rendererHelpers.ts     # Shared renderer utilities
├── types/             # TypeScript type definitions
├── utils/             # Editor, world, and scene utilities
├── App.tsx            # Main application component
└── main.tsx           # Entry point
```

## License

MIT

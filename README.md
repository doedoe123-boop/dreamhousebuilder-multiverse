# Dream House Builder

A web-based 3D house builder where you can design and walk through your dream house. Built with React, Three.js, and TypeScript.

## Features

- **3D Building Tools** — Place pillars, walls, doors, windows, steel bars, roofs, and furniture
- **First-Person Mode** — Press `V` to enter first-person view and walk through your creation with WASD + mouse look
- **Roblox-Style Character** — Third-person player character with WASD movement and camera follow
- **Foreman NPC** — A construction foreman who gives contextual tips via speech bubble
- **Drag & Drop** — Click to place, select, and delete objects on a snapping grid
- **Undo Support** — `Ctrl+Z` to undo any action
- **Keyboard Shortcuts** — Number keys `1-8` to switch tools (essential in first-person mode)
- **Local Save/Load** — Persist your designs to localStorage
- **Material Selection** — Choose between wood, concrete, and steel for structural elements

## Controls

| Key          | Action                                                                         |
| ------------ | ------------------------------------------------------------------------------ |
| `W A S D`    | Move character                                                                 |
| `V`          | Toggle first-person view                                                       |
| `1-8`        | Switch tools (Inspect, Pillar, Wall, Door, Window, Steel Bar, Roof, Furniture) |
| `H`          | Toggle UI toolbar                                                              |
| `Delete`     | Remove selected object                                                         |
| `Ctrl+Z`     | Undo                                                                           |
| `Arrow Keys` | Nudge selected object                                                          |
| `Esc`        | Deselect / exit first-person                                                   |

## Tech Stack

- **React 19** + TypeScript
- **Three.js** for 3D rendering
- **Konva.js** for 2D canvas (editor overlay)
- **Vite** for dev/build tooling
- LocalStorage for persistence

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
│   ├── canvas/        # 2D Konva editor components
│   ├── layout/        # Floating toolbar UI
│   └── three/         # 3D view wrapper
├── constants/         # Editor & scene config
├── hooks/             # Custom React hooks
├── renderer3d/        # Three.js renderer modules
│   ├── worldRenderer.ts       # Main renderer orchestrator
│   ├── worldMeshBuilder.ts    # 3D mesh construction
│   ├── playerCharacter.ts     # Player & foreman NPC
│   └── rendererHelpers.ts     # Shared utilities
├── types/             # TypeScript type definitions
├── utils/             # Editor, world, and scene utilities
├── App.tsx            # Main application component
└── main.tsx           # Entry point
```

## License

MIT

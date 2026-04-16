# AGENTS.md — Dream House Builder

## Project Overview
Dream House Builder is currently a web-based, local-first, 3D house-construction builder.

Users can:
- place structural elements such as pillars and walls
- add doors, windows, steel bars, roofs, and furniture
- paint supported surfaces
- inspect, delete, undo, and save/load their project locally
- follow a guided build flow while working in 3D

Long-term vision may still include sharing, online persistence, and multiplayer, but the current product is a standalone browser-based builder.

---

## Product Focus
Agents must prioritize:
- a stable 3D-first build workflow
- predictable tool behavior
- simple local persistence
- beginner-friendly guidance

Do not over-engineer.

Current priority is not feature sprawl. Current priority is making the existing house-building workflow dependable and understandable.

---

## Active Scope
The active app includes:
- 3D world rendering and interaction
- floating tool panels
- structural tools
- furnishing and paint tools
- guide/dialogue support
- local save/load
- undo and basic editing behavior

No backend, no auth, no cloud storage, and no multiplayer in the current phase.

---

## Tech Stack Rules
- React frontend only
- TypeScript preferred for structure
- Three.js is the active rendering layer
- LocalStorage for persistence

Legacy Konva/2D code may still exist in the repo, but it is not the primary product direction.

Avoid introducing unnecessary libraries unless explicitly required.

---

## Architecture Principles

### 1. Keep state centralized
- The app should use a single `world` source of truth
- All tools should read from and write to the same world object

### 2. UI reflects the world
- Rendering layers should reflect world state, not invent parallel object state
- Placement previews and ghosts can be temporary, but persisted objects must come from the world model

### 3. Minimal abstraction
- Prefer direct, readable logic
- Split code only when it clearly improves maintainability

### 4. Tool-driven interaction
- Tools control interaction mode
- Only one active tool at a time
- Tool behavior should be consistent across placement, selection, deletion, and save/load

---

## Data Model Guideline
The current world may include:
- foundation
- walls
- pillars
- doors
- windows
- steel bars
- roofs
- furniture

Useful supported attributes include:
- structural material
- floor
- color

Avoid unnecessary nesting and metadata unless it clearly supports current builder behavior.

---

## Interaction Rules
Agents should ensure:
- object placement is immediate and understandable
- selection is visually obvious
- delete and undo work reliably
- guide messaging helps non-experts understand what to do next
- camera and movement controls do not fight the user

---

## Persistence Rules
- Save the full world state to LocalStorage
- Load restores the exact project shape through normalization
- Maintain backward compatibility where practical for older saved layouts
- No backend or cloud storage in the current phase

---

## Explicitly Out Of Scope
- Multiplayer logic
- Authentication
- Database or API integration
- Cloud save
- Heavy state frameworks unless explicitly requested

---

## Coding Style
- Prefer simple functional components
- Keep logic readable over clever
- Avoid premature optimization
- Use types where they improve clarity
- Keep files focused and reasonably small

---

## AI Agent Behavior Guidelines
When making changes:

1. Prefer working, stable tool behavior over ambitious new systems
2. Keep changes localized when possible
3. Do not refactor unrelated code
4. Do not introduce unnecessary libraries
5. Keep docs aligned with the real product state
6. Treat beginner usability as a first-class concern

---

## Definition Of Done For The Current Phase
The current phase is successful when:
- a user can open the app and understand the builder flow
- core 3D tools work reliably
- guide and dialogue support the build sequence
- save/load and undo are dependable
- the app feels like a usable dream-house construction prototype

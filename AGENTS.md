# 🤖 AGENTS.md — Dream House Builder

## 🧠 Project Overview
This is a web-based Dream House Builder MVP.

Users can:
- Create and edit a 2D house layout
- Add rooms and furniture
- Drag, move, and delete objects
- Save and load their designs locally

Long-term vision includes:
- Online sharing of houses
- Visiting other users’ houses
- Multiplayer interaction
- 3D visualization

---

## 🎯 MVP Focus (VERY IMPORTANT)
Agents MUST prioritize simplicity and working functionality.

Do NOT over-engineer.

The MVP is only:
- Canvas-based editor
- Rooms + furniture objects
- Drag & drop interactions
- Local save/load

No backend, no auth, no multiplayer, no 3D.

---

## ⚙️ Tech Stack Rules
- React frontend only
- Konva.js for all canvas rendering
- TypeScript preferred for structure
- LocalStorage for persistence

Avoid introducing unnecessary libraries unless explicitly required.

---

## 🧱 Architecture Principles

### 1. Keep state simple
- House = list of rooms + furniture objects
- Use plain JSON structures

### 2. Canvas-first design
- All visual elements must be rendered via Konva
- No DOM-based positioning for objects

### 3. Minimal abstraction
- Avoid over-engineering services, layers, or frameworks
- Prefer direct, readable logic

### 4. Single responsibility components
- Canvas renders objects
- Toolbar triggers actions
- State logic is centralized

---

## 🧠 Data Model Guideline
All objects should follow simple shape-based models:

- Rooms: id, x, y, width, height, name
- Furniture: id, type, x, y

No complex nesting or unnecessary metadata.

---

## 🎮 Interaction Rules

Agents should ensure:
- Objects are draggable
- Selected object can be deleted
- New objects are added via toolbar actions
- UI feedback is immediate and responsive

---

## 💾 Persistence Rules
- Save full house state to LocalStorage
- Load restores exact previous state
- No backend or cloud storage in MVP

---

## 🚫 Explicitly Forbidden (for MVP)
- No multiplayer logic
- No authentication system
- No database integration
- No 3D rendering
- No Redux / heavy state frameworks
- No excessive folder abstraction

---

## 🧭 Coding Style

- Prefer simple functional components
- Keep logic readable over “clever”
- Avoid premature optimization
- Use TypeScript types only where helpful
- Keep files small and focused

---

## 🤖 AI Agent Behavior Guidelines

When making changes:

1. Prefer working code over perfect architecture
2. Keep changes minimal and localized
3. Do not refactor unrelated code
4. Do not introduce new libraries unless necessary
5. Preserve MVP simplicity at all times

---

## 🚀 Definition of Done (MVP)
The project is complete when:
- A user can open the app
- Add rooms and furniture visually
- Drag and rearrange objects
- Save and reload the layout successfully
- Everything runs smoothly in the browser

---
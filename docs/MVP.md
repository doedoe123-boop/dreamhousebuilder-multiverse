# 🏠 Dream House Builder — MVP Idea Spec

## 🧠 Product Idea
A web app where users can design their dream house using a simple drag-and-drop interface. Users build rooms and place furniture on a 2D canvas, similar to a lightweight Sims build mode or simple interior design tool.

The long-term vision is to evolve this into a social platform where users can publish their houses, visit other users’ houses, and eventually experience them in 3D and multiplayer.

---

## 🎯 MVP Goal
Build the simplest possible version that proves the core loop:

> “User creates a house layout → places objects → saves it → reloads it later”

No backend. No accounts. No multiplayer. No 3D.

---

## 🧩 Core MVP Features

### 🧱 1. Canvas Builder
- 2D interactive canvas
- Users can add and move objects freely
- Objects snap or move smoothly (drag & drop)

---

### 🏠 2. Rooms
- Users can create rectangular rooms
- Rooms can be moved and resized
- Each room represents a space (Bedroom, Kitchen, etc.)

---

### 🪑 3. Furniture Objects
- Basic furniture items (bed, sofa, table)
- Placeable anywhere inside the canvas
- Draggable and selectable
- Can be deleted

---

### 🎛 4. Simple Toolbar
A minimal UI with actions like:
- Add Room
- Add Bed
- Add Sofa
- Add Table
- Delete Selected
- Save
- Load

---

### 💾 5. Save / Load
- Save entire house layout locally in the browser
- Load saved layout and restore everything exactly as it was

---

## 🧠 Data Concept (very simple mental model)
- A “house” is just a collection of:
  - rooms (shapes)
  - furniture (objects with type + position)
- Everything is stored as JSON and re-rendered on load

---

## ⚙️ Tech Direction
- React frontend
- Konva.js for canvas rendering
- TypeScript for structure and scalability
- LocalStorage for persistence

---

## 🚀 Success Definition
MVP is complete when:
- You can design a simple house layout
- You can place furniture visually
- You can save and reload your design
- Everything feels smooth and interactive

---

## 🌍 Future Expansion (not part of MVP)
- User accounts and cloud saving
- Sharing houses via links
- Visiting other users’ houses
- Real-time multiplayer presence
- 3D walkthrough mode
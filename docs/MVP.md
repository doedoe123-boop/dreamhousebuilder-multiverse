# Dream House Builder — Current Product Baseline

## Product Idea
Dream House Builder is now a 3D-first house-construction sandbox. Users build a house directly in a Three.js scene using guided tools, then save and reload the project locally.

The experience is closer to a lightweight Sims-style build mode mixed with a beginner-friendly construction guide:
- place structure first
- add openings and roof
- furnish and paint
- save the project locally

Long-term vision can still include sharing, visiting other houses, cloud save, and multiplayer, but those are not part of the current product scope.

---

## Story Frame
The current product should feel like arriving at your own plot of land with a foreman already on-site, ready to help you build.

The intended narrative is:
- the player arrives at an open piece of land
- the foreman is already there waiting to guide the job
- the player can build freely, but can also rely on the foreman for simple next-step advice
- the house is built in natural order: foundation first, then structure, then finishing touches

This story matters because it makes the guide feel like part of the world instead of disconnected UI.

Short product pitch:

> You arrive at your land, meet the foreman, and build your dream house step by step with help always nearby.

Important note for implementation:
- the foreman should sound calm, practical, and welcoming
- helper dialogue should include light small-talk, not just instructions
- narrative copy should never assume the user is an architect or carpenter

---

## Current Goal
Ship a stable local-first 3D builder that proves this loop:

> Place structure → shape the house → furnish it → save it → load it later

No backend. No accounts. No multiplayer.

---

## Current Core Features

### 1. 3D Construction Workspace
- Three.js-based 3D scene
- orbit / pan / zoom controls
- optional first-person walkthrough mode
- floating tool panels that can be collapsed while building

### 2. Structural Building Tools
- Pillar tool
- Wall tool
- Door tool
- Window tool
- Steel bar tool
- Roof tool

### 3. Interior and Finish Tools
- Furniture placement (`bed`, `sofa`, `table`)
- Paint tool for supported surfaces
- material selection for structural elements (`wood`, `steel`)

### 4. Editing and Project Controls
- select objects in 3D
- delete selected object
- undo recent actions
- floor switching
- local save/load

### 5. Guided Builder UX
- step-by-step builder guide
- contextual helper dialogue
- status messaging for the active tool
- a foreman-led onboarding tone that feels human, not robotic

---

## Current World Model
The app stores a house as a single `world` object containing:

- `foundation`
- `walls`
- `pillars`
- `furniture`
- `doors`
- `windows`
- `steelBars`
- `roofs`

Important properties already supported in the model include:
- structural material
- floor index
- paint color on supported surfaces

Everything is stored as JSON in `localStorage` and restored through normalization on load.

---

## Tech Direction
- React frontend
- TypeScript
- Three.js for the active builder and rendering layer
- LocalStorage for persistence

Legacy 2D canvas code still exists in the repo, but the active product direction is the 3D-first builder.

---

## Success Definition
This phase is successful when:
- a user can build a basic multi-part house in 3D
- the core tools behave predictably
- guide/onboarding helps beginners understand the order of work
- the project saves and reloads correctly
- the builder feels stable enough to keep expanding

---

## Current Gaps To Address Next
- complete and polish all existing tools so they behave consistently
- improve editing after placement
- make guide flow feel central instead of secondary
- strengthen the foreman story so guidance feels like world interaction, not tooltips only
- strengthen placement rules and structural integrity
- clean up legacy code and outdated docs

---

## Future Expansion
- sharing and cloud save
- social house visiting
- multiplayer collaboration
- richer room semantics
- stronger architecture/construction validation

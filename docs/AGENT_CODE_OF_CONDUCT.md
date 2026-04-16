# Agent Code Of Conduct

This document defines how agents should work in the Dream House Builder codebase.

It exists to keep the project maintainable as the product grows.

The goal is not bureaucracy. The goal is consistent structure, readable code, and safer iteration.

---

## 1. Core Rule

Agents must leave the codebase easier to work in than they found it.

That means:
- no unnecessary complexity
- no silent architectural drift
- no giant catch-all files when a clean split is clearly needed
- no features that bypass the current world model or tool system

---

## 2. Source Of Truth

All persisted build state must flow through the `world` model.

Agents must not:
- invent parallel persisted state for tools or scene objects
- hide real product behavior in renderer-only structures
- split saved data across unrelated stores

Agents may use temporary UI-only state for:
- previews
- hover
- dialogue panel state
- local interaction flow

But persisted objects must come from `world`.

---

## 3. File Size And Structure Rules

Agents must treat file size as a maintainability signal.

### Soft limits
- preferred component or utility file size: under 300 lines
- caution zone: 300-500 lines
- over 500 lines: split if the file contains multiple responsibilities

### Hard guidance
If a file grows past 500 lines and mixes 2 or more concerns, agents should split it before adding more complexity.

Typical examples:
- UI layout mixed with business logic
- scene setup mixed with interaction logic
- dialogue content mixed with world mutation logic
- one component rendering multiple unrelated panels

Do not split files into tiny fragments without benefit.
Split only when the result is clearer.

---

## 4. Responsibility Boundaries

Agents should preserve the following boundaries.

### `App.tsx`
Owns:
- top-level app state
- world state orchestration
- major UI coordination
- save/load/undo entry points

Should not become:
- a giant renderer implementation
- a giant dialogue content file
- a place for long inline data tables unless temporary

### `components/`
Own:
- presentation
- UI composition
- local interaction state

Should not own:
- persisted world mutation policy
- deep renderer internals

### `renderer3d/`
Owns:
- Three.js scene setup
- scene objects
- camera behavior
- raycasting and 3D interaction plumbing

Should not own:
- app-wide persistence rules
- product copy
- toolbar business rules

### `utils/`
Own:
- pure helpers
- world reasoning
- dialogue logic
- transformation functions

Should stay mostly pure and reusable.

### `constants/`
Own:
- stable config
- default values
- labels that are reused in many places

Should not become a dumping ground for arbitrary app logic.

---

## 5. Extraction Rules

Agents should extract code when one of these becomes true:

- a component has more than one major UI section with separate concerns
- a file has repeated object-shape mapping logic
- a helper can be pure and reused
- a renderer file contains clearly separate systems, such as:
  - environment
  - character logic
  - tool interaction
  - object previews
  - camera control

Good extraction targets:
- `use...` hooks for reusable app logic
- `utils/...` for pure calculation or dialogue helpers
- `components/layout/...` for HUD and panels
- `renderer3d/...` submodules for scene systems

---

## 6. Tool And World Consistency Rules

Agents must keep tool behavior consistent.

Each tool should have:
- one clear activation path
- one clear placement model
- one clear status message
- predictable selection behavior
- save/load compatibility

If a tool needs special behavior, agents should document why in code or docs.

Do not let one tool become a special-case hack that breaks the common model.

---

## 7. UI And UX Rules

Agents must protect beginner usability.

That means:
- use plain language
- avoid jargon where possible
- prefer guided actions over hidden rules
- make interactive states visible
- do not bury critical controls behind confusing layout

Every new UI addition should answer:
- what is this for?
- when should the user use it?
- what happens next?

---

## 8. Renderer Rules

The 3D layer must stay readable and modular.

Agents should:
- keep scene construction separated from app state decisions when possible
- avoid huge inline geometry blocks if they can be extracted cleanly
- avoid mixing environment art, character behavior, and tool placement in one long function when a split is obvious

Performance rules:
- avoid unnecessary React state writes from per-frame interaction
- avoid expensive rebuilds during pointer move unless required
- keep renderer-driven temporary visuals out of persisted state

---

## 9. Dialogue And Narrative Rules

The foreman is part of the product, not decoration.

Agents should keep his writing:
- warm
- practical
- beginner-friendly
- concise

He should sound like:
- an experienced builder
- patient
- encouraging
- not childish
- not robotic

Dialogue systems should be data-driven where possible, not buried in JSX.

---

## 10. Refactor Rules

Agents should refactor when:
- a file is clearly too large
- a boundary is clearly violated
- new work would otherwise make the structure worse

Agents should not refactor:
- unrelated code just because it is imperfect
- large areas of the app without clear user value
- stable code unless the current task genuinely depends on it

Refactors should be:
- localized
- justified
- verified

---

## 11. Verification Rules

After meaningful changes, agents should verify with:
- `npm run lint`
- `npm run build`

If verification cannot be run, agents must say so clearly.

---

## 12. Docs Rules

When architecture or product direction changes, agents must update docs.

At minimum, check whether changes should affect:
- `AGENTS.md`
- `docs/MVP.md`
- `README.md`

Docs should reflect the real product, not the old plan.

---

## 13. Role-Specific Rules For Agents

### Product/UX agents
- prioritize clarity and guidance
- avoid adding UI clutter
- design for first-time builders

### Renderer/3D agents
- keep interaction smooth
- avoid camera behavior that fights the user
- prefer clear modular scene systems over one giant renderer blob

### World/data agents
- preserve normalization
- keep persistence backward-compatible where practical
- keep the world model coherent and minimal

### Dialogue/story agents
- write in-world guidance that supports the build loop
- avoid lore that the scene does not support yet
- keep copy helpful before clever

### Documentation agents
- document the product as it actually exists
- note legacy systems clearly
- do not leave architecture decisions implicit

---

## 14. Default Decision Rule

If an agent is unsure between:
- a fast hack
- a small clean structure improvement

choose the clean structure improvement, as long as it does not balloon scope.

If unsure between:
- building new surface area
- stabilizing the current workflow

choose stabilization first.

---

## 15. Practical Standard For This Repo

For Dream House Builder, agents should generally prefer:
- one clear `world` model
- small focused components
- extracted dialogue helpers
- modular renderer files
- explicit tool flows
- local-first persistence
- documentation that stays current

This is the standard to follow for future work.

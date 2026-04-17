import { useMemo, useState } from "react";
import { FURNITURE_CATALOG } from "../../constants/furniture";
import { PAINT_COLORS } from "../../constants/paint";
import { STRUCTURAL_MATERIALS } from "../../constants/structure";
import {
  IconCursor,
  IconDoor,
  IconFoundation,
  IconFurniture,
  IconPaintBrush,
  IconPillar,
  IconRoof,
  IconSteelBar,
  IconWall,
  IconWindow,
} from "../icons/ToolIcons";
import type {
  FurnitureType,
  SelectedObject,
  StructuralMaterial,
  ToolMode,
  World,
} from "../../types/world";

type ToolbarSection = "review" | "structure" | "openings" | "finishing" | "project";

type FloatingToolbarProps = {
  world: World;
  currentTool: ToolMode;
  currentMaterial: StructuralMaterial;
  currentFurnitureType: FurnitureType;
  selectedObject: SelectedObject;
  selectedResizeInfo: {
    primaryLabel: string;
    primaryValue: number;
    secondaryLabel: string | null;
    secondaryValue: number | null;
  } | null;
  statusMessage: string;
  canUndo: boolean;
  onSetTool: (tool: ToolMode) => void;
  onSetMaterial: (material: StructuralMaterial) => void;
  onSetFurnitureType: (type: FurnitureType) => void;
  onSaveWorld: () => void;
  onLoadWorld: () => void;
  onDeleteSelected: () => void;
  onResizeSelectedPrimary: (direction: -1 | 1) => void;
  onResizeSelectedHeight: (direction: -1 | 1) => void;
  onUndo: () => void;
  currentPaintColor: string;
  onSetPaintColor: (color: string) => void;
  currentFloor: number;
  onSetFloor: (floor: number) => void;
};

const TOOL_SECTION_BY_TOOL: Record<ToolMode, ToolbarSection> = {
  select: "review",
  foundation: "structure",
  pillar: "structure",
  wall: "structure",
  steelbar: "structure",
  door: "openings",
  window: "openings",
  roof: "finishing",
  furniture: "finishing",
  paint: "finishing",
};

export function FloatingToolbar({
  world,
  currentTool,
  currentMaterial,
  currentFurnitureType,
  selectedObject,
  selectedResizeInfo,
  statusMessage,
  canUndo,
  onSetTool,
  onSetMaterial,
  onSetFurnitureType,
  onSaveWorld,
  onLoadWorld,
  onDeleteSelected,
  onResizeSelectedPrimary,
  onResizeSelectedHeight,
  onUndo,
  currentPaintColor,
  onSetPaintColor,
  currentFloor,
  onSetFloor,
}: FloatingToolbarProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [statusOpen, setStatusOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<ToolbarSection>(
    TOOL_SECTION_BY_TOOL[currentTool],
  );
  const visibleSection =
    activeSection === "project" ? "project" : TOOL_SECTION_BY_TOOL[currentTool];

  const totalsSummary = useMemo(
    () =>
      `${world.walls.length} walls / ${world.pillars.length} pillars / ${world.doors.length} doors / ${world.windows.length} windows / ${world.steelBars.length} bars / ${world.roofs.length} roofs / ${world.furniture.length} items`,
    [world],
  );

  const sectionTitle = {
    review: "Review",
    structure: "Structure",
    openings: "Openings",
    finishing: "Finishing",
    project: "Project",
  } satisfies Record<ToolbarSection, string>;

  return (
    <>
      <div className="floating-nav">
        <div className="floating-nav__brand">Dream House Builder</div>
        <button
          type="button"
          className={`floating-nav__tab ${activeSection === "review" ? "is-active" : ""}`}
          onClick={() => {
            setActiveSection("review");
            onSetTool("select");
          }}
        >
          <IconCursor />
          Review
        </button>
        <button
          type="button"
          className={`floating-nav__tab ${activeSection === "structure" ? "is-active" : ""}`}
          onClick={() => {
            setActiveSection("structure");
            if (!["pillar", "wall", "steelbar"].includes(currentTool)) {
              onSetTool("pillar");
            }
          }}
        >
          <IconWall />
          Structure
        </button>
        <button
          type="button"
          className={`floating-nav__tab ${activeSection === "openings" ? "is-active" : ""}`}
          onClick={() => {
            setActiveSection("openings");
            if (!["door", "window"].includes(currentTool)) {
              onSetTool("door");
            }
          }}
        >
          <IconDoor />
          Openings
        </button>
        <button
          type="button"
          className={`floating-nav__tab ${activeSection === "finishing" ? "is-active" : ""}`}
          onClick={() => {
            setActiveSection("finishing");
            if (!["roof", "furniture", "paint"].includes(currentTool)) {
              onSetTool("roof");
            }
          }}
        >
          <IconRoof />
          Finishing
        </button>
        <button
          type="button"
          className={`floating-nav__tab ${activeSection === "project" ? "is-active" : ""}`}
          onClick={() => setActiveSection("project")}
        >
          <IconPaintBrush />
          Project
        </button>
      </div>

      <div className="floating-panel floating-panel--left">
        {leftOpen ? (
          <div className="floating-drawer">
            <div className="floating-drawer__header">
              <div>
                <div className="floating-drawer__eyebrow">Tools</div>
                <div className="floating-drawer__title">
                  {sectionTitle[visibleSection]}
                </div>
              </div>
              <button
                type="button"
                className="floating-tool floating-tool--icon"
                onClick={() => setLeftOpen(false)}
              >
                Hide
              </button>
            </div>

            {visibleSection === "review" && (
              <div className="floating-drawer__body">
                <button
                  type="button"
                  className={`floating-tool floating-tool--wide ${currentTool === "select" ? "is-active" : ""}`}
                  onClick={() => onSetTool("select")}
                >
                  <IconCursor />
                  Inspect and Select
                </button>

                {selectedObject ? (
                  <div className="floating-stack">
                    <div className="floating-badge floating-badge--muted">
                      Selected: {selectedObject.kind}
                    </div>
                    <button
                      type="button"
                      className="floating-tool floating-tool--danger floating-tool--wide"
                      onClick={onDeleteSelected}
                    >
                      Delete Selected
                    </button>
                    {selectedResizeInfo && (
                      <div className="floating-stack">
                        <div className="floating-badge floating-badge--muted">
                          {selectedResizeInfo.primaryLabel}:{" "}
                          {selectedResizeInfo.primaryValue.toFixed(1)}
                        </div>
                        <div className="floating-segment">
                          <button
                            type="button"
                            className="floating-tool"
                            onClick={() => onResizeSelectedPrimary(-1)}
                          >
                            -
                          </button>
                          <button
                            type="button"
                            className="floating-tool"
                            onClick={() => onResizeSelectedPrimary(1)}
                          >
                            +
                          </button>
                        </div>
                        {selectedResizeInfo.secondaryLabel &&
                          selectedResizeInfo.secondaryValue !== null && (
                            <>
                              <div className="floating-badge floating-badge--muted">
                                {selectedResizeInfo.secondaryLabel}:{" "}
                                {selectedResizeInfo.secondaryValue.toFixed(1)}
                              </div>
                              <div className="floating-segment">
                                <button
                                  type="button"
                                  className="floating-tool"
                                  onClick={() => onResizeSelectedHeight(-1)}
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  className="floating-tool"
                                  onClick={() => onResizeSelectedHeight(1)}
                                >
                                  +
                                </button>
                              </div>
                            </>
                          )}
                        <div className="floating-note">
                          Use <kbd>[</kbd> and <kbd>]</kbd> to resize. Hold{" "}
                          <kbd>Shift</kbd> for height.
                        </div>
                      </div>
                    )}
                    <div className="floating-note">
                      Use arrow keys to nudge the selected object.
                    </div>
                  </div>
                ) : (
                  <div className="floating-note">
                    Click any placed object to inspect it, then delete or nudge it.
                  </div>
                )}
              </div>
            )}

            {visibleSection === "structure" && (
              <div className="floating-drawer__body">
                <div className="floating-segment">
                  <button
                    type="button"
                    className={`floating-tool ${currentTool === "foundation" ? "is-active" : ""}`}
                    onClick={() => onSetTool("foundation")}
                  >
                    <IconFoundation />
                    Foundation
                  </button>
                  <button
                    type="button"
                    className={`floating-tool ${currentTool === "pillar" ? "is-active" : ""}`}
                    onClick={() => onSetTool("pillar")}
                  >
                    <IconPillar />
                    Pillar
                  </button>
                  <button
                    type="button"
                    className={`floating-tool ${currentTool === "wall" ? "is-active" : ""}`}
                    onClick={() => onSetTool("wall")}
                  >
                    <IconWall />
                    Wall
                  </button>
                  <button
                    type="button"
                    className={`floating-tool ${currentTool === "steelbar" ? "is-active" : ""}`}
                    onClick={() => onSetTool("steelbar")}
                  >
                    <IconSteelBar />
                    Steel Bar
                  </button>
                </div>

                <div className="floating-stack">
                  <div className="floating-badge floating-badge--muted">
                    Structural Material
                  </div>
                  <div className="floating-swatch-grid">
                    {STRUCTURAL_MATERIALS.map((material) => (
                      <button
                        key={material.value}
                        type="button"
                        className={`floating-tool ${currentMaterial === material.value ? "is-active" : ""}`}
                        onClick={() => onSetMaterial(material.value)}
                      >
                        <span
                          className="toolbar__swatch"
                          style={{ backgroundColor: material.color }}
                        />
                        {material.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {visibleSection === "openings" && (
              <div className="floating-drawer__body">
                <div className="floating-segment">
                  <button
                    type="button"
                    className={`floating-tool ${currentTool === "door" ? "is-active" : ""}`}
                    onClick={() => onSetTool("door")}
                  >
                    <IconDoor />
                    Door
                  </button>
                  <button
                    type="button"
                    className={`floating-tool ${currentTool === "window" ? "is-active" : ""}`}
                    onClick={() => onSetTool("window")}
                  >
                    <IconWindow />
                    Window
                  </button>
                </div>
                <div className="floating-note">
                  Openings attach directly to existing walls, so build structure first.
                </div>
              </div>
            )}

            {visibleSection === "finishing" && (
              <div className="floating-drawer__body">
                <div className="floating-segment">
                  <button
                    type="button"
                    className={`floating-tool ${currentTool === "roof" ? "is-active" : ""}`}
                    onClick={() => onSetTool("roof")}
                  >
                    <IconRoof />
                    Roof
                  </button>
                  <button
                    type="button"
                    className={`floating-tool ${currentTool === "furniture" ? "is-active" : ""}`}
                    onClick={() => onSetTool("furniture")}
                  >
                    <IconFurniture />
                    Furniture
                  </button>
                  <button
                    type="button"
                    className={`floating-tool ${currentTool === "paint" ? "is-active" : ""}`}
                    onClick={() => onSetTool("paint")}
                  >
                    <IconPaintBrush />
                    Paint
                  </button>
                </div>

                {currentTool === "furniture" && (
                  <div className="floating-stack">
                    <div className="floating-badge floating-badge--muted">
                      Furniture Type
                    </div>
                    <div className="floating-swatch-grid">
                      {FURNITURE_CATALOG.map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          className={`floating-tool ${currentFurnitureType === item.type ? "is-active" : ""}`}
                          onClick={() => onSetFurnitureType(item.type)}
                        >
                          <span
                            className="toolbar__swatch"
                            style={{ backgroundColor: item.fill }}
                          />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentTool === "paint" && (
                  <div className="floating-stack">
                    <div className="floating-badge floating-badge--muted">
                      Paint Palette
                    </div>
                    <div className="floating-paint-grid">
                      {PAINT_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`floating-tool floating-tool--swatch ${currentPaintColor === color.value ? "is-active" : ""}`}
                          onClick={() => onSetPaintColor(color.value)}
                          title={color.label}
                        >
                          <span
                            className="toolbar__swatch toolbar__swatch--lg"
                            style={{ backgroundColor: color.value }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {visibleSection === "project" && (
              <div className="floating-drawer__body">
                <div className="floating-stack">
                  <div className="floating-badge">{totalsSummary}</div>
                  <div className="floating-badge floating-badge--muted">
                    Orbit: drag | Pan: right-drag | Zoom: scroll
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="floating-tool floating-tool--edge"
            onClick={() => setLeftOpen(true)}
          >
            Open Tools
          </button>
        )}
      </div>

      <div className="floating-panel floating-panel--right">
        {rightOpen ? (
          <div className="floating-drawer floating-drawer--compact">
            <div className="floating-drawer__header">
              <div>
                <div className="floating-drawer__eyebrow">Project</div>
                <div className="floating-drawer__title">Build Controls</div>
              </div>
              <button
                type="button"
                className="floating-tool floating-tool--icon"
                onClick={() => setRightOpen(false)}
              >
                Hide
              </button>
            </div>

            <div className="floating-drawer__body">
              <div className="floating-segment">
                <button type="button" className="floating-tool" onClick={onSaveWorld}>
                  Save
                </button>
                <button type="button" className="floating-tool" onClick={onLoadWorld}>
                  Load
                </button>
                <button
                  type="button"
                  className="floating-tool"
                  onClick={onUndo}
                  disabled={!canUndo}
                >
                  Undo
                </button>
              </div>

              <div className="floating-stack">
                <div className="floating-badge floating-badge--muted">Active Floor</div>
                <div className="floating-segment">
                  <button
                    type="button"
                    className="floating-tool"
                    disabled={currentFloor <= 0}
                    onClick={() => onSetFloor(Math.max(0, currentFloor - 1))}
                  >
                    ▼
                  </button>
                  <span className="floating-badge floating-badge--wide">
                    {currentFloor === 0 ? "Ground Floor" : `Floor ${currentFloor}`}
                  </span>
                  <button
                    type="button"
                    className="floating-tool"
                    disabled={currentFloor >= 9}
                    onClick={() => onSetFloor(Math.min(9, currentFloor + 1))}
                  >
                    ▲
                  </button>
                </div>
              </div>

              <div className="floating-stack">
                <div className="floating-badge floating-badge--muted">
                  Current Focus
                </div>
                <div className="floating-note">
                  {selectedObject
                    ? `Selected ${selectedObject.kind}.`
                    : "No object selected. Use Review to inspect placed pieces."}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="floating-tool floating-tool--edge"
            onClick={() => setRightOpen(true)}
          >
            Open Project
          </button>
        )}
      </div>

      {statusOpen ? (
        <div className="floating-status">
          <div className="floating-toolbar__header">
            <div className="floating-badge">Builder Status</div>
            <button
              type="button"
              className="floating-tool floating-tool--icon"
              onClick={() => setStatusOpen(false)}
            >
              Hide
            </button>
          </div>
          <div>{statusMessage}</div>
        </div>
      ) : (
        <button
          type="button"
          className="floating-tool floating-tool--toggle floating-tool--status"
          onClick={() => setStatusOpen(true)}
        >
          Open Status
        </button>
      )}
    </>
  );
}

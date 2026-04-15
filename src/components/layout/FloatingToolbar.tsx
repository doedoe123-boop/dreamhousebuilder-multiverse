import { type ReactNode, useState } from "react";
import { FURNITURE_CATALOG } from "../../constants/furniture";
import { STRUCTURAL_MATERIALS } from "../../constants/structure";
import {
  IconCursor,
  IconDoor,
  IconFurniture,
  IconPaintBrush,
  IconPillar,
  IconRoof,
  IconSteelBar,
  IconWall,
  IconWindow,
} from "../icons/ToolIcons";
import { PAINT_COLORS } from "../../constants/paint";
import type {
  FurnitureType,
  SelectedObject,
  StructuralMaterial,
  ToolMode,
  World,
} from "../../types/world";

type FloatingToolbarProps = {
  world: World;
  currentTool: ToolMode;
  currentMaterial: StructuralMaterial;
  currentFurnitureType: FurnitureType;
  selectedObject: SelectedObject;
  statusMessage: string;
  canUndo: boolean;
  onSetTool: (tool: ToolMode) => void;
  onSetMaterial: (material: StructuralMaterial) => void;
  onSetFurnitureType: (type: FurnitureType) => void;
  onSaveWorld: () => void;
  onLoadWorld: () => void;
  onDeleteSelected: () => void;
  onUndo: () => void;
  currentPaintColor: string;
  onSetPaintColor: (color: string) => void;
  currentFloor: number;
  onSetFloor: (floor: number) => void;
};

export function FloatingToolbar({
  world,
  currentTool,
  currentMaterial,
  currentFurnitureType,
  selectedObject,
  statusMessage,
  canUndo,
  onSetTool,
  onSetMaterial,
  onSetFurnitureType,
  onSaveWorld,
  onLoadWorld,
  onDeleteSelected,
  onUndo,
  currentPaintColor,
  onSetPaintColor,
  currentFloor,
  onSetFloor,
}: FloatingToolbarProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [statusOpen, setStatusOpen] = useState(true);

  const toolGroups: Array<{
    label: string;
    icon: ReactNode;
    tools: Array<{ mode: ToolMode; label: string; icon: ReactNode }>;
  }> = [
    {
      label: "General",
      icon: <IconCursor />,
      tools: [{ mode: "select", label: "Inspect", icon: <IconCursor /> }],
    },
    {
      label: "Structure",
      icon: <IconWall />,
      tools: [
        { mode: "pillar", label: "Pillar", icon: <IconPillar /> },
        { mode: "wall", label: "Wall", icon: <IconWall /> },
        { mode: "steelbar", label: "Steel Bar", icon: <IconSteelBar /> },
      ],
    },
    {
      label: "Openings",
      icon: <IconDoor />,
      tools: [
        { mode: "door", label: "Door", icon: <IconDoor /> },
        { mode: "window", label: "Window", icon: <IconWindow /> },
      ],
    },
    {
      label: "Finishing",
      icon: <IconRoof />,
      tools: [
        { mode: "roof", label: "Roof", icon: <IconRoof /> },
        { mode: "furniture", label: "Furniture", icon: <IconFurniture /> },
        { mode: "paint", label: "Paint", icon: <IconPaintBrush /> },
      ],
    },
  ];

  const showMaterialPicker = currentTool === "pillar" || currentTool === "wall";
  const showFurniturePicker = currentTool === "furniture";
  const showPaintPicker = currentTool === "paint";

  return (
    <>
      <div className="floating-panel floating-panel--left">
        {leftOpen ? (
          <>
            <div className="floating-toolbar floating-toolbar--stack">
              <div className="floating-toolbar__header">
                <div className="floating-badge">Build Tools</div>
                <button
                  type="button"
                  className="floating-tool floating-tool--icon"
                  onClick={() => setLeftOpen(false)}
                >
                  Hide
                </button>
              </div>
            </div>

            {toolGroups.map((group) => (
              <div
                key={group.label}
                className="floating-toolbar floating-toolbar--stack"
              >
                <div className="floating-badge floating-badge--muted floating-badge--group">
                  <span className="floating-tool__icon">{group.icon}</span>
                  {group.label}
                </div>
                <div className="floating-toolbar__group floating-toolbar__group--stack">
                  {group.tools.map((tool) => (
                    <button
                      key={tool.mode}
                      type="button"
                      className={`floating-tool ${currentTool === tool.mode ? "is-active" : ""}`}
                      onClick={() => onSetTool(tool.mode)}
                    >
                      <span className="floating-tool__icon">{tool.icon}</span>
                      {tool.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {showMaterialPicker && (
              <div className="floating-toolbar floating-toolbar--stack">
                <div className="floating-badge floating-badge--muted">
                  Material
                </div>
                <div className="floating-toolbar__group floating-toolbar__group--stack">
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
            )}

            {showFurniturePicker && (
              <div className="floating-toolbar floating-toolbar--stack">
                <div className="floating-badge floating-badge--muted">
                  Furniture Type
                </div>
                <div className="floating-toolbar__group floating-toolbar__group--stack">
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

            {showPaintPicker && (
              <div className="floating-toolbar floating-toolbar--stack">
                <div className="floating-badge floating-badge--muted">
                  Paint Color
                </div>
                <div className="floating-toolbar__group floating-toolbar__group--paint">
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

            <div className="floating-toolbar floating-toolbar--stack">
              <div className="floating-badge floating-badge--muted">Floor</div>
              <div className="floating-toolbar__group">
                <button
                  type="button"
                  className="floating-tool"
                  disabled={currentFloor <= 0}
                  onClick={() => onSetFloor(Math.max(0, currentFloor - 1))}
                >
                  ▼
                </button>
                <span className="floating-badge">
                  {currentFloor === 0 ? "Ground" : `Floor ${currentFloor}`}
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

            {selectedObject && (
              <div className="floating-toolbar floating-toolbar--stack">
                <div className="floating-badge floating-badge--muted">
                  Selected: {selectedObject.kind}
                </div>
                <button
                  type="button"
                  className="floating-tool floating-tool--danger"
                  onClick={onDeleteSelected}
                >
                  Delete
                </button>
                <div className="floating-badge floating-badge--muted">
                  Use arrow keys to nudge
                </div>
              </div>
            )}

            {canUndo && (
              <div className="floating-toolbar floating-toolbar--stack">
                <button
                  type="button"
                  className="floating-tool"
                  onClick={onUndo}
                >
                  Undo (Ctrl+Z)
                </button>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            className="floating-tool floating-tool--toggle"
            onClick={() => setLeftOpen(true)}
          >
            Open Tools
          </button>
        )}
      </div>

      <div className="floating-panel floating-panel--right">
        {rightOpen ? (
          <>
            <div className="floating-toolbar floating-toolbar--stack floating-toolbar--compact">
              <div className="floating-toolbar__header">
                <div className="floating-badge">Project</div>
                <button
                  type="button"
                  className="floating-tool floating-tool--icon"
                  onClick={() => setRightOpen(false)}
                >
                  Hide
                </button>
              </div>
              <div className="floating-toolbar__group">
                <button
                  type="button"
                  className="floating-tool"
                  onClick={onSaveWorld}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="floating-tool"
                  onClick={onLoadWorld}
                >
                  Load
                </button>
              </div>
            </div>

            <div className="floating-toolbar floating-toolbar--stack">
              <div className="floating-badge">
                {world.walls.length} walls / {world.pillars.length} pillars /{" "}
                {world.doors.length} doors / {world.windows.length} windows /{" "}
                {world.steelBars.length} bars / {world.roofs.length} roofs /{" "}
                {world.furniture.length} items
              </div>
              <div className="floating-badge floating-badge--muted">
                Orbit: drag | Pan: right-drag | Zoom: scroll
              </div>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="floating-tool floating-tool--toggle"
            onClick={() => setRightOpen(true)}
          >
            Open Project
          </button>
        )}
      </div>

      {statusOpen ? (
        <div className="floating-status">
          <div className="floating-toolbar__header">
            <div className="floating-badge">Status</div>
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

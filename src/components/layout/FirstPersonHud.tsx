import type { SelectedObject, ToolMode } from "../../types/world";

type ResizeInfo = {
  primaryLabel: string;
  primaryValue: number;
  secondaryLabel: string | null;
  secondaryValue: number | null;
};

type FirstPersonHudProps = {
  currentTool: ToolMode;
  currentFloor: number;
  selectedObject: SelectedObject;
  selectedResizeInfo: ResizeInfo | null;
  onDeleteSelected: () => void;
  onResizeSelectedPrimary: (direction: -1 | 1) => void;
  onResizeSelectedHeight: (direction: -1 | 1) => void;
};

const TOOL_ROWS: Array<{ key: string; label: string; tool: ToolMode }> = [
  { key: "1", label: "Foundation", tool: "foundation" },
  { key: "2", label: "Inspect", tool: "select" },
  { key: "3", label: "Pillar", tool: "pillar" },
  { key: "4", label: "Wall", tool: "wall" },
  { key: "5", label: "Door", tool: "door" },
  { key: "6", label: "Window", tool: "window" },
  { key: "7", label: "Steel Bar", tool: "steelbar" },
  { key: "8", label: "Roof", tool: "roof" },
  { key: "9", label: "Furniture", tool: "furniture" },
];

export function FirstPersonHud({
  currentTool,
  currentFloor,
  selectedObject,
  selectedResizeInfo,
  onDeleteSelected,
  onResizeSelectedPrimary,
  onResizeSelectedHeight,
}: FirstPersonHudProps) {
  return (
    <>
      <div className="fp-key-guide">
        <div className="fp-key-guide__title">Controls</div>
        <div className="fp-key-guide__row">
          <kbd>W A S D</kbd> Move
        </div>
        <div className="fp-key-guide__row">
          <kbd>Mouse</kbd> Look
        </div>
        <div className="fp-key-guide__row">
          <kbd>Click</kbd> Place / Select
        </div>
        <div className="fp-key-guide__row">
          <kbd>H</kbd> Toggle HUD
        </div>
        <div className="fp-key-guide__row">
          <kbd>Esc</kbd> Exit FP
        </div>
        <div className="fp-key-guide__divider" />
        <div className="fp-key-guide__title">Floor</div>
        <div className="fp-key-guide__row is-active">
          <kbd>PgUp/Dn</kbd> {currentFloor === 0 ? "Ground" : `Floor ${currentFloor}`}
        </div>
        <div className="fp-key-guide__divider" />
        <div className="fp-key-guide__title">Tools</div>
        {TOOL_ROWS.map((row) => (
          <div
            key={row.tool}
            className={
              "fp-key-guide__row" + (currentTool === row.tool ? " is-active" : "")
            }
          >
            <kbd>{row.key}</kbd> {row.label}
          </div>
        ))}
      </div>

      <div className="fp-edit-panel">
        <div className="fp-edit-panel__title">Selected Object</div>
        {selectedObject ? (
          <div className="fp-edit-panel__body">
            <div className="fp-edit-panel__badge">{selectedObject.kind}</div>

            {selectedResizeInfo ? (
              <>
                <div className="fp-edit-panel__metric">
                  {selectedResizeInfo.primaryLabel}:{" "}
                  {selectedResizeInfo.primaryValue.toFixed(1)}
                </div>
                <div className="fp-edit-panel__controls">
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
                      <div className="fp-edit-panel__metric">
                        {selectedResizeInfo.secondaryLabel}:{" "}
                        {selectedResizeInfo.secondaryValue.toFixed(1)}
                      </div>
                      <div className="fp-edit-panel__controls">
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
              </>
            ) : (
              <div className="fp-edit-panel__note">
                This object does not have size controls yet.
              </div>
            )}

            <button
              type="button"
              className="floating-tool floating-tool--danger floating-tool--wide"
              onClick={onDeleteSelected}
            >
              Delete Selected
            </button>

            <div className="fp-edit-panel__note">
              Use <kbd>[</kbd> and <kbd>]</kbd> to resize. Hold <kbd>Shift</kbd>{" "}
              for height.
            </div>
          </div>
        ) : (
          <div className="fp-edit-panel__body">
            <div className="fp-edit-panel__note">
              Click a pillar or wall to inspect it and adjust its size here.
            </div>
          </div>
        )}
      </div>
    </>
  );
}

import type { ToolMode } from "../../types/world";

type ForemanTopic = "stuck" | "simple" | "ideas" | null;

type ForemanPanelProps = {
  isNearForeman: boolean;
  isTalkingToForeman: boolean;
  foremanTopic: ForemanTopic;
  foremanStageLabel: string;
  foremanSuggestedTool: ToolMode | null;
  onSetTopic: (topic: ForemanTopic) => void;
  onShowSuggestedTool: () => void;
  onInspectMode: () => void;
};

function getToolLabel(tool: ToolMode) {
  switch (tool) {
    case "foundation":
      return "Foundation";
    case "pillar":
      return "Pillar";
    case "wall":
      return "Wall";
    case "door":
      return "Door";
    case "window":
      return "Window";
    case "roof":
      return "Roof";
    case "furniture":
      return "Furniture";
    default:
      return tool;
  }
}

export function ForemanPanel({
  isNearForeman,
  isTalkingToForeman,
  foremanTopic,
  foremanStageLabel,
  foremanSuggestedTool,
  onSetTopic,
  onShowSuggestedTool,
  onInspectMode,
}: ForemanPanelProps) {
  if (!isNearForeman) return null;

  return (
    <>
      <div className="floating-foreman-prompt">
        <div className="floating-foreman-prompt__eyebrow">Foreman Cabin</div>
        <div className="floating-foreman-prompt__title">
          {isTalkingToForeman ? "Talking with the foreman" : "Foreman nearby"}
        </div>
        <div className="floating-foreman-prompt__text">
          {isTalkingToForeman
            ? "Press E or Esc to close the conversation."
            : "Press E to talk. He stays here as your on-site build mentor."}
        </div>
        {!isTalkingToForeman && (
          <div className="floating-foreman-prompt__key">E</div>
        )}
      </div>

      {isTalkingToForeman && (
        <div className="floating-foreman-actions">
          <div className="floating-foreman-actions__header">
            <span className="floating-foreman-actions__name">
              Foreman Elias
            </span>
            <span className="floating-foreman-actions__badge">
              {foremanStageLabel}
            </span>
          </div>
          <div className="floating-foreman-actions__buttons">
            <button
              type="button"
              className={
                "floating-tool floating-foreman-actions__btn" +
                (foremanTopic === "stuck" ? " is-active" : "")
              }
              onClick={() =>
                onSetTopic(foremanTopic === "stuck" ? null : "stuck")
              }
            >
              I'm stuck
            </button>
            <button
              type="button"
              className={
                "floating-tool floating-foreman-actions__btn" +
                (foremanTopic === "simple" ? " is-active" : "")
              }
              onClick={() =>
                onSetTopic(foremanTopic === "simple" ? null : "simple")
              }
            >
              Explain simply
            </button>
            <button
              type="button"
              className={
                "floating-tool floating-foreman-actions__btn" +
                (foremanTopic === "ideas" ? " is-active" : "")
              }
              onClick={() =>
                onSetTopic(foremanTopic === "ideas" ? null : "ideas")
              }
            >
              Ideas
            </button>
            {foremanSuggestedTool && (
              <button
                type="button"
                className="floating-tool floating-foreman-actions__btn"
                onClick={onShowSuggestedTool}
              >
                {getToolLabel(foremanSuggestedTool)} tool
              </button>
            )}
            <button
              type="button"
              className="floating-tool floating-foreman-actions__btn"
              onClick={onInspectMode}
            >
              Inspect
            </button>
          </div>
          <div className="floating-foreman-actions__hint">
            Press <kbd>E</kbd> or <kbd>Esc</kbd> to close
          </div>
        </div>
      )}
    </>
  );
}

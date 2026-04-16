import type { ToolMode } from "../../types/world";

type ForemanTopic = "stuck" | "simple" | "ideas" | null;

type ForemanPanelProps = {
  isNearForeman: boolean;
  isTalkingToForeman: boolean;
  foremanTopic: ForemanTopic;
  foremanStageLabel: string;
  foremanTone: string;
  foremanDialogue: string;
  foremanSmallTalk: string;
  foremanSuggestedStep: string;
  foremanSuggestedTool: ToolMode | null;
  foremanStuckAdvice: string;
  foremanSimpleExplanation: string;
  foremanIdeas: string;
  foremanMemoryReflection: string | null;
  foremanWhyThisMatters: string;
  foremanWhatComesAfter: string;
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
  foremanTone,
  foremanDialogue,
  foremanSmallTalk,
  foremanSuggestedStep,
  foremanSuggestedTool,
  foremanStuckAdvice,
  foremanSimpleExplanation,
  foremanIdeas,
  foremanMemoryReflection,
  foremanWhyThisMatters,
  foremanWhatComesAfter,
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
        <div className="floating-foreman-chat">
          <div className="floating-foreman-chat__eyebrow">Foreman Cabin</div>
          <div className="floating-foreman-chat__header">
            <div className="floating-foreman-chat__title">Foreman Elias</div>
            <div className="floating-foreman-chat__badge">
              {foremanStageLabel}
            </div>
          </div>
          <div className="floating-foreman-chat__tone">{foremanTone}</div>

          <div className="floating-foreman-chat__section">
            <div className="floating-foreman-chat__label">What he says</div>
            <p>{foremanDialogue}</p>
          </div>

          <div className="floating-foreman-chat__section">
            <div className="floating-foreman-chat__label">Ask Elias</div>
            <div className="floating-foreman-chat__actions floating-foreman-chat__actions--compact">
              <button
                type="button"
                className={
                  "floating-tool floating-tool--wide floating-foreman-chat__action" +
                  (foremanTopic === "stuck" ? " is-active" : "")
                }
                onClick={() => onSetTopic("stuck")}
              >
                I'm stuck
              </button>
              <button
                type="button"
                className={
                  "floating-tool floating-tool--wide floating-foreman-chat__action" +
                  (foremanTopic === "simple" ? " is-active" : "")
                }
                onClick={() => onSetTopic("simple")}
              >
                Explain this simply
              </button>
              <button
                type="button"
                className={
                  "floating-tool floating-tool--wide floating-foreman-chat__action" +
                  (foremanTopic === "ideas" ? " is-active" : "")
                }
                onClick={() => onSetTopic("ideas")}
              >
                Give me ideas
              </button>
            </div>
            {foremanTopic === "stuck" && (
              <p className="floating-foreman-chat__reply">{foremanStuckAdvice}</p>
            )}
            {foremanTopic === "simple" && (
              <p className="floating-foreman-chat__reply">
                {foremanSimpleExplanation}
              </p>
            )}
            {foremanTopic === "ideas" && (
              <p className="floating-foreman-chat__reply">{foremanIdeas}</p>
            )}
          </div>

          <div className="floating-foreman-chat__section">
            <div className="floating-foreman-chat__label">Small talk</div>
            <p>{foremanSmallTalk}</p>
          </div>

          <div className="floating-foreman-chat__section">
            <div className="floating-foreman-chat__label">
              Recommended next step
            </div>
            <p>{foremanSuggestedStep}</p>
            <div className="floating-foreman-chat__actions">
              {foremanSuggestedTool && (
                <button
                  type="button"
                  className="floating-tool floating-tool--wide floating-foreman-chat__action"
                  onClick={onShowSuggestedTool}
                >
                  Show me the {getToolLabel(foremanSuggestedTool)} tool
                </button>
              )}
              <button
                type="button"
                className="floating-tool floating-tool--wide floating-foreman-chat__action"
                onClick={onInspectMode}
              >
                Take me to inspect mode
              </button>
            </div>
          </div>

          {foremanMemoryReflection && (
            <div className="floating-foreman-chat__section">
              <div className="floating-foreman-chat__label">
                What Elias remembers
              </div>
              <p>{foremanMemoryReflection}</p>
            </div>
          )}

          <div className="floating-foreman-chat__section">
            <div className="floating-foreman-chat__label">Why this matters</div>
            <p>{foremanWhyThisMatters}</p>
          </div>

          <div className="floating-foreman-chat__section">
            <div className="floating-foreman-chat__label">What comes after</div>
            <p>{foremanWhatComesAfter}</p>
          </div>
        </div>
      )}
    </>
  );
}

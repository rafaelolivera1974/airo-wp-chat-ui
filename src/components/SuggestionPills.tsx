import type { AskPrompt } from '../lib/agentTypes'
import './SuggestionPills.css'

type SuggestionPillsProps = {
  ask: AskPrompt
  onSelect: (buttonId: string) => void
}

export function SuggestionPills({ ask, onSelect }: SuggestionPillsProps) {
  return (
    <div
      className="suggestion-pills"
      role="group"
      aria-label="Suggested responses"
    >
      {ask.buttons.map((btn) => (
        <button
          key={btn.id}
          type="button"
          className="suggestion-pills__btn"
          onClick={() => onSelect(btn.id)}
        >
          {btn.label}
        </button>
      ))}
    </div>
  )
}

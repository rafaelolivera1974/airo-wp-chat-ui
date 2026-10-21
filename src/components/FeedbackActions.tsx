import './FeedbackActions.css'

type FeedbackActionsProps = {
  mode: 'undo' | 'retry'
  onAction?: () => void
}

function ThumbsUpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3m7-2V5a3 3 0 00-3-3l-4 9v11h8.28a2 2 0 001.98-1.7l1.38-9A2 2 0 0017.66 8H14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ThumbsDownIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17 2h3a2 2 0 012 2v7a2 2 0 01-2 2h-3m-7 2v4a3 3 0 003 3l4-9V2H6.72a2 2 0 00-1.98 1.7l-1.38 9A2 2 0 006.34 16H10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RedoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 7v6h-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 16.5A9 9 0 0119.5 8L21 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function UndoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 7v6h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 16.5A9 9 0 004.5 8L3 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function FeedbackActions({ mode, onAction }: FeedbackActionsProps) {
  return (
    <div className="feedback-actions" role="group" aria-label="Message actions">
      <div className="feedback-actions__votes">
        <button type="button" className="feedback-actions__icon" aria-label="Good response">
          <ThumbsUpIcon />
        </button>
        <button type="button" className="feedback-actions__icon" aria-label="Bad response">
          <ThumbsDownIcon />
        </button>
      </div>
      <button
        type="button"
        className="feedback-actions__text-btn"
        onClick={onAction}
      >
        {mode === 'undo' ? <UndoIcon /> : <RedoIcon />}
        <span>{mode === 'undo' ? 'Undo' : 'Retry'}</span>
      </button>
    </div>
  )
}

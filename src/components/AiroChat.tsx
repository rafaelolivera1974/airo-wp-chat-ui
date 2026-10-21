import { useEffect, useId, useRef, useState } from 'react'
import { ActivityCard, ProgressCard } from './AgentCards'
import { FeedbackActions } from './FeedbackActions'
import { SuggestionPills } from './SuggestionPills'
import {
  ChatIcon,
  CloseIcon,
  CrosshairsIcon,
  MicIcon,
  MinusIcon,
  PlusIcon,
  SendIcon,
  SettingsIcon,
  StylesIcon,
} from './icons'
import type { AgentRunState } from '../hooks/useAgentRun'
import { isHappyPathScenario, USER_SEED, type ScenarioId } from '../lib/agentTypes'
import './AiroChat.css'

type TabId = 'chat' | 'styles' | 'settings'

type AiroChatProps = {
  agent: AgentRunState
  onTogglePlan: () => void
  onToggleActivity: () => void
  onAnswerAsk: () => void
  onFeedbackAction: () => void
}

export function AiroChat({
  agent,
  onTogglePlan,
  onToggleActivity,
  onAnswerAsk,
  onFeedbackAction,
}: AiroChatProps) {
  const [activeTab, setActiveTab] = useState<TabId>('chat')
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const feedRef = useRef<HTMLUListElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const formId = useId()

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [
    agent.intro,
    agent.plan,
    agent.feed,
    agent.summary,
    agent.ask,
    agent.phase,
  ])

  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [agent.feed])

  const feedbackMode =
    agent.phase === 'complete'
      ? isHappyPathScenario(agent.scenario)
        ? 'undo'
        : 'retry'
      : null

  return (
    <aside className="airo-chat" aria-label="Airo chat">
      <header className="airo-chat__header">
        <div className="airo-chat__logo-wrap">
          <img
            src="/assets/airo-only.svg"
            alt="Airo"
            className="airo-chat__logo"
            width={52}
            height={24}
          />
        </div>
        <div className="airo-chat__header-actions">
          <button type="button" className="airo-chat__icon-btn" aria-label="Minimize">
            <MinusIcon size={16} />
          </button>
          <button type="button" className="airo-chat__icon-btn" aria-label="Close">
            <CloseIcon size={16} />
          </button>
        </div>
      </header>

      <nav className="airo-chat__tabs" aria-label="Airo sections">
        <button
          type="button"
          className={`airo-chat__tab${activeTab === 'chat' ? ' is-active' : ''}`}
          aria-current={activeTab === 'chat' ? 'page' : undefined}
          onClick={() => setActiveTab('chat')}
        >
          <ChatIcon size={24} />
          <span>Chat</span>
        </button>
        <button
          type="button"
          className={`airo-chat__tab${activeTab === 'styles' ? ' is-active' : ''} is-muted`}
          aria-current={activeTab === 'styles' ? 'page' : undefined}
          onClick={() => setActiveTab('styles')}
        >
          <StylesIcon size={24} />
          <span>Styles</span>
        </button>
        <button
          type="button"
          className={`airo-chat__tab${activeTab === 'settings' ? ' is-active' : ''} is-muted`}
          aria-current={activeTab === 'settings' ? 'page' : undefined}
          onClick={() => setActiveTab('settings')}
        >
          <SettingsIcon size={24} />
          <span>Settings</span>
        </button>
      </nav>

      {activeTab === 'chat' ? (
        <div className="airo-chat__body">
          <div className="airo-chat__conversation" ref={listRef}>
            <div className="airo-chat__user">
              <div className="airo-chat__user-bubble">
                <p>{USER_SEED}</p>
              </div>
            </div>

            {agent.intro ? (
              <div className="airo-chat__ai">
                <p className="airo-chat__ai-body">{agent.intro}</p>
              </div>
            ) : null}

            {agent.plan ? (
              <ProgressCard
                plan={agent.plan}
                open={agent.planOpen}
                note={agent.planNote}
                finalTitle={agent.planFinal}
                onToggle={onTogglePlan}
              />
            ) : null}

            {agent.phase !== 'idle' ? (
              <ActivityCard
                feed={agent.feed}
                steps={agent.steps}
                open={agent.activityOpen}
                onToggle={onToggleActivity}
                feedRef={feedRef}
              />
            ) : null}

            {agent.ask ? (
              <div className="airo-chat__ai">
                <p className="airo-chat__ai-body">{agent.ask.label}</p>
              </div>
            ) : null}

            {agent.summary ? (
              <div className="airo-chat__ai">
                <p className="airo-chat__ai-body">
                  I added a <strong>Services</strong> page with 4 services,
                  images, and a link in your main navigation.
                </p>
              </div>
            ) : null}

            {feedbackMode ? (
              <FeedbackActions
                mode={feedbackMode}
                onAction={onFeedbackAction}
              />
            ) : null}
          </div>

          <form
            className="airo-chat__engage"
            id={formId}
            onSubmit={(e) => e.preventDefault()}
          >
            {agent.ask ? (
              <SuggestionPills ask={agent.ask} onSelect={() => onAnswerAsk()} />
            ) : null}
            <div className="airo-chat__prompt">
              <label className="airo-chat__field-label" htmlFor={`${formId}-input`}>
                Message Airo
              </label>
              <textarea
                id={`${formId}-input`}
                ref={inputRef}
                className="airo-chat__textarea"
                rows={2}
                placeholder="Ask Airo to edit your site…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="airo-chat__actions">
                <div className="airo-chat__actions-left">
                  <button
                    type="button"
                    className="airo-chat__tool-btn"
                    aria-label="Attach"
                  >
                    <PlusIcon size={18} />
                  </button>
                  <button
                    type="button"
                    className="airo-chat__tool-btn"
                    aria-label="Select element"
                  >
                    <CrosshairsIcon size={18} />
                  </button>
                </div>
                <div className="airo-chat__actions-right">
                  <button
                    type="button"
                    className="airo-chat__tool-btn"
                    aria-label="Voice input"
                  >
                    <MicIcon size={18} />
                  </button>
                  <button
                    type="submit"
                    className="airo-chat__send"
                    aria-label="Send"
                    disabled
                  >
                    <SendIcon size={16} />
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="airo-chat__placeholder">
          <p>{activeTab === 'styles' ? 'Styles' : 'Settings'} panel</p>
        </div>
      )}
    </aside>
  )
}

export type { ScenarioId }

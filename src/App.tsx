import { useEffect, useRef, useState } from 'react'
import { AiroChat } from './components/AiroChat'
import { ScenarioControls } from './components/ScenarioControls'
import { useAgentRun } from './hooks/useAgentRun'
import type { ScenarioId } from './lib/agentTypes'
import './App.css'

export default function App() {
  const [scenario, setScenario] = useState<ScenarioId>('normal')
  const [speed, setSpeed] = useState(1)
  const {
    state,
    play,
    stop,
    sendMessage,
    answerAsk,
    togglePlan,
    toggleActivity,
    toggleArchivePlan,
    toggleArchiveActivity,
  } = useAgentRun(speed, scenario)
  const booted = useRef(false)

  useEffect(() => {
    if (booted.current) return
    booted.current = true
    void play()
  }, [play])

  return (
    <div className="app-shell">
      <ScenarioControls
        scenario={scenario}
        speed={speed}
        running={state.phase === 'running'}
        onScenarioChange={setScenario}
        onSpeedChange={setSpeed}
        onPlay={() => void play()}
      />
      <AiroChat
        agent={state}
        onTogglePlan={togglePlan}
        onToggleActivity={toggleActivity}
        onToggleArchivePlan={toggleArchivePlan}
        onToggleArchiveActivity={toggleArchiveActivity}
        onAnswerAsk={answerAsk}
        onFeedbackAction={() => void play()}
        onStop={stop}
        onSend={(text) => void sendMessage(text)}
      />
    </div>
  )
}

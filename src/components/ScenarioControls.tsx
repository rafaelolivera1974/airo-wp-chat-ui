import { SCENARIOS, type ScenarioId } from '../lib/agentTypes'
import './ScenarioControls.css'

type ScenarioControlsProps = {
  scenario: ScenarioId
  speed: number
  running: boolean
  onScenarioChange: (id: ScenarioId) => void
  onSpeedChange: (speed: number) => void
  onPlay: () => void
}

export function ScenarioControls({
  scenario,
  speed,
  running,
  onScenarioChange,
  onSpeedChange,
  onPlay,
}: ScenarioControlsProps) {
  return (
    <aside className="scenario-controls" aria-label="Prototype controls">
      <button
        type="button"
        className="scenario-controls__play"
        onClick={onPlay}
      >
        {running ? '▶ Restart' : '▶ Run'}
      </button>

      <label className="scenario-controls__field">
        <span>Scenario</span>
        <select
          value={scenario}
          onChange={(e) => onScenarioChange(e.target.value as ScenarioId)}
        >
          {SCENARIOS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="scenario-controls__field">
        <span>Speed ({speed.toFixed(1)}×)</span>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.5}
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
        />
      </label>
    </aside>
  )
}

import type { Phase } from '@/hooks/useHiitTimer'

interface ProgressBarProps {
  phase: Phase
  timeLeft: number
  totalTime: number
}

const PHASE_FILL_COLORS: Record<Phase, string> = {
  idle: 'bg-teal-500',
  prep: 'bg-amber-400',
  work: 'bg-green-400',
  rest: 'bg-blue-400',
  done: 'bg-teal-400',
}

export function ProgressBar({ phase, timeLeft, totalTime }: ProgressBarProps) {
  const pct = phase === 'done'
    ? 100
    : totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0

  return (
    <div className="h-1 bg-slate-700 mx-0">
      <div
        data-testid="progress-fill"
        className={`h-full transition-all duration-1000 ${PHASE_FILL_COLORS[phase]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

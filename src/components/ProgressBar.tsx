import type { Phase } from '@/hooks/useHiitTimer'

interface ProgressBarProps {
  phase: Phase
  timeLeft: number
  totalTime: number
}

const FILL_COLOR: Record<Phase, string> = {
  idle: 'bg-teal-500',
  prep: 'bg-amber-400',
  work: 'bg-orange-500',
  rest: 'bg-blue-400',
  done: 'bg-emerald-400',
}

export function ProgressBar({ phase, timeLeft, totalTime }: ProgressBarProps) {
  const pct = phase === 'done'
    ? 100
    : totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0

  return (
    <div className="h-1.5 bg-[#1e2d3d]">
      <div
        data-testid="progress-fill"
        className={`h-full transition-all duration-1000 ${FILL_COLOR[phase]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

import type { Phase } from '@/hooks/useHiitTimer'

interface TimerDisplayProps {
  phase: Phase
  timeLeft: number
  currentRound: number
  totalRounds: number
}

const PHASE_COLORS: Record<Phase, string> = {
  idle: 'text-white',
  prep: 'text-amber-400',
  work: 'text-green-400',
  rest: 'text-blue-400',
  done: 'text-teal-400',
}

const PHASE_LABELS: Record<Phase, string> = {
  idle: 'READY',
  prep: 'GET READY',
  work: 'WORK',
  rest: 'REST',
  done: 'DONE!',
}

export function TimerDisplay({ phase, timeLeft, currentRound, totalRounds }: TimerDisplayProps) {
  const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0')
  const ss = (timeLeft % 60).toString().padStart(2, '0')
  const showDot = phase !== 'idle' && phase !== 'done'

  return (
    <div className="text-center py-8 px-5">
      <div className={`text-xs font-bold tracking-widest uppercase mb-2 ${PHASE_COLORS[phase]}`}>
        {showDot && <span className="mr-1">●</span>}
        {PHASE_LABELS[phase]}
      </div>
      <div className="text-8xl font-black font-mono tracking-tighter text-white leading-none">
        {mm}:{ss}
      </div>
      <div className="text-xs text-gray-400 mt-3 tracking-widest">
        {phase !== 'idle'
          ? `ROUND ${currentRound} / ${totalRounds}`
          : `${totalRounds} ROUNDS`}
      </div>
    </div>
  )
}

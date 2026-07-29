import { Check, Pause, Play, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Phase } from '@/hooks/useWorkoutTimer'

interface ControlButtonsProps {
  phase: Phase
  isRunning: boolean
  isRepsRound: boolean
  onResume: () => void
  onPause: () => void
  onCompleteReps: () => void
  onReset: () => void
}

const PHASE_CTA_STYLE: Record<Phase, string> = {
  idle: 'bg-teal-500 hover:bg-teal-400 text-slate-900',
  prep: 'bg-amber-400 hover:bg-amber-300 text-slate-900',
  work: 'bg-orange-500 hover:bg-orange-400 text-white',
  rest: 'bg-blue-500 hover:bg-blue-400 text-white',
  cooldown: 'bg-cyan-500 hover:bg-cyan-400 text-slate-900',
  done: 'bg-emerald-500 hover:bg-emerald-400 text-slate-900',
}

const baseBtn =
  'w-full rounded-2xl font-condensed font-bold tracking-wider flex items-center justify-center gap-3 transition-colors duration-200 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60'

export function ControlButtons({
  phase,
  isRunning,
  isRepsRound,
  onResume,
  onPause,
  onCompleteReps,
  onReset,
}: ControlButtonsProps) {
  // A reps round has no countdown, so PAUSE would be a dead button — DONE
  // takes the same primary slot instead.
  const primary = isRepsRound
    ? { label: 'DONE', icon: Check, onClick: onCompleteReps }
    : isRunning
      ? { label: 'PAUSE', icon: Pause, onClick: onPause }
      : { label: 'RESUME', icon: Play, onClick: onResume }

  const Icon = primary.icon

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-label={primary.label}
        onClick={primary.onClick}
        className={cn(baseBtn, 'min-h-[56px] text-xl', PHASE_CTA_STYLE[phase])}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
        {primary.label}
      </button>

      <button
        type="button"
        aria-label="RESET"
        onClick={onReset}
        className={cn(
          baseBtn,
          'min-h-[44px] text-sm font-semibold',
          'border border-slate-700/60 bg-transparent text-slate-500 hover:border-slate-500 hover:text-slate-300',
        )}
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        RESET
      </button>
    </div>
  )
}

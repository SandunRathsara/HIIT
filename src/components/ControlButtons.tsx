import { Play, Pause, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Phase } from '@/hooks/useHiitTimer'

interface ControlButtonsProps {
  phase: Phase
  isRunning: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
}

const PHASE_CTA_STYLE: Record<Phase, string> = {
  idle: 'bg-teal-500 hover:bg-teal-400 text-slate-900',
  prep: 'bg-amber-400 hover:bg-amber-300 text-slate-900',
  work: 'bg-orange-500 hover:bg-orange-400 text-white',
  rest: 'bg-blue-500 hover:bg-blue-400 text-white',
  done: 'bg-emerald-500 hover:bg-emerald-400 text-slate-900',
}

const baseBtn = 'w-full rounded-2xl font-condensed font-bold tracking-wider flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'

export function ControlButtons({ phase, isRunning, onStart, onPause, onReset }: ControlButtonsProps) {
  const showPause = isRunning
  const showStartOrResume = !isRunning && phase !== 'done'
  const startLabel = phase === 'idle' ? 'START' : 'RESUME'

  return (
    <div className="flex flex-col gap-3">
      {showStartOrResume && (
        <button
          aria-label={startLabel}
          className={cn(baseBtn, 'h-16 text-xl', PHASE_CTA_STYLE[phase])}
          onClick={onStart}
        >
          <Play className="w-5 h-5 fill-current" aria-hidden="true" />
          {startLabel}
        </button>
      )}

      {showPause && (
        <button
          aria-label="PAUSE"
          className={cn(baseBtn, 'h-16 text-xl', PHASE_CTA_STYLE[phase])}
          onClick={onPause}
        >
          <Pause className="w-5 h-5 fill-current" aria-hidden="true" />
          PAUSE
        </button>
      )}

      <button
        aria-label="↺"
        className={cn(
          baseBtn,
          'h-12 text-sm font-semibold',
          'bg-transparent border border-slate-700/60 hover:border-slate-500 text-slate-500 hover:text-slate-300',
          'disabled:opacity-25 disabled:cursor-not-allowed disabled:active:scale-100'
        )}
        onClick={onReset}
        disabled={phase === 'idle'}
      >
        <RotateCcw className="w-4 h-4" aria-hidden="true" />
        RESET
      </button>
    </div>
  )
}

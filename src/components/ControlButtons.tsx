import { Button } from '@/components/ui/button'
import type { Phase } from '@/hooks/useHiitTimer'

interface ControlButtonsProps {
  phase: Phase
  isRunning: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
}

export function ControlButtons({ phase, isRunning, onStart, onPause, onReset }: ControlButtonsProps) {
  const showPause = isRunning
  const showStartOrResume = !isRunning && phase !== 'done'
  const startLabel = phase === 'idle' ? 'START' : 'RESUME'

  return (
    <div className="flex gap-3 px-5 pb-5">
      {showStartOrResume && (
        <Button
          className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-900 font-extrabold text-base tracking-wider h-12 rounded-xl"
          onClick={onStart}
        >
          {startLabel}
        </Button>
      )}
      {showPause && (
        <Button
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-base tracking-wider h-12 rounded-xl"
          onClick={onPause}
        >
          PAUSE
        </Button>
      )}
      <Button
        variant="ghost"
        className="bg-slate-800 hover:bg-slate-700 text-slate-400 h-12 px-5 rounded-xl text-xl"
        onClick={onReset}
        disabled={phase === 'idle'}
        aria-label="↺"
      >
        ↺
      </Button>
    </div>
  )
}

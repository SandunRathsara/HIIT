import { Check } from 'lucide-react'
import { formatClock } from '@/lib/duration'

interface CompletePanelProps {
  workoutName: string
  rounds: number
  totalSeconds: number
  onAgain: () => void
  onBackToList: () => void
}

export function CompletePanel({
  workoutName,
  rounds,
  totalSeconds,
  onAgain,
  onBackToList,
}: CompletePanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
          <Check className="h-8 w-8 text-emerald-400" aria-hidden="true" />
        </span>

        <p className="mt-4 font-condensed text-3xl font-black tracking-wide text-emerald-400 uppercase">
          Complete
        </p>
        <p className="mt-1 max-w-[24ch] truncate font-condensed text-lg font-bold text-white uppercase">
          {workoutName}
        </p>

        <p className="mt-5 font-condensed text-sm font-semibold tracking-[3px] text-slate-500 uppercase tabular-nums">
          {rounds} {rounds === 1 ? 'round' : 'rounds'} · {formatClock(totalSeconds)}
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-2.5 px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onAgain}
          className="min-h-[56px] w-full cursor-pointer rounded-2xl bg-teal-500 font-condensed text-xl font-bold tracking-wider text-slate-900 uppercase transition-colors duration-200 hover:bg-teal-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Do it again
        </button>
        <button
          type="button"
          onClick={onBackToList}
          className="min-h-[48px] w-full cursor-pointer rounded-2xl border border-slate-700 font-condensed text-base font-semibold tracking-wider text-slate-400 uppercase transition-colors duration-200 hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
        >
          Back to workouts
        </button>
      </div>
    </div>
  )
}

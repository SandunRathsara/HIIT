import { Play } from 'lucide-react'
import type { Workout } from '@/db/schema'
import {
  estimateWorkoutSeconds,
  formatClock,
  restRangeLabel,
  roundExerciseLabel,
  roundTargetLabel,
  workRangeLabel,
} from '@/lib/duration'

interface PreStartPanelProps {
  workout: Workout
  onStart: () => void
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/50 py-2.5">
      <span className="font-condensed text-[11px] font-semibold tracking-[3px] text-slate-500 uppercase">
        {label}
      </span>
      <span className="font-condensed text-base font-bold text-slate-200 tabular-nums">{value}</span>
    </div>
  )
}

export function PreStartPanel({ workout, onStart }: PreStartPanelProps) {
  const first = workout.rounds[0]

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-1 flex-col justify-center overflow-hidden px-5">
        <div className="text-center">
          <p className="font-condensed text-5xl font-black text-white tabular-nums">
            ~{formatClock(estimateWorkoutSeconds(workout))}
          </p>
          <p className="mt-1 font-condensed text-xs font-semibold tracking-[4px] text-slate-500 uppercase">
            {workout.rounds.length} {workout.rounds.length === 1 ? 'Round' : 'Rounds'}
          </p>
        </div>

        <div className="mt-6">
          <Stat label="Work" value={workRangeLabel(workout.rounds)} />
          <Stat label="Rest" value={restRangeLabel(workout.rounds)} />
          <Stat
            label="Prep"
            value={workout.prepareDelay ? `${workout.prepareSeconds}s` : 'Off'}
          />
        </div>

        {first && (
          <div className="mt-6 text-center">
            <p className="font-condensed text-[11px] font-semibold tracking-[3px] text-teal-500 uppercase">
              Up first
            </p>
            <p className="mt-1 truncate font-condensed text-2xl font-bold text-white uppercase">
              {roundExerciseLabel(first)}
            </p>
            <p className="mt-0.5 text-sm text-slate-500 tabular-nums">{roundTargetLabel(first)}</p>
          </div>
        )}
      </div>

      <div className="shrink-0 px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onStart}
          className="flex min-h-[64px] w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-teal-500 font-condensed text-2xl font-bold tracking-wider text-slate-900 uppercase transition-colors duration-200 hover:bg-teal-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <Play className="h-6 w-6 fill-current" aria-hidden="true" />
          Start
        </button>
      </div>
    </div>
  )
}

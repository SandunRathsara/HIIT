import { ChevronRight } from 'lucide-react'
import type { Workout } from '@/db/schema'
import { estimateWorkoutSeconds, formatClock } from '@/lib/duration'
import { formatRelative } from '@/lib/relativeTime'

interface WorkoutCardProps {
  workout: Workout
  now: number
  onOpen: () => void
}

export function WorkoutCard({ workout, now, onOpen }: WorkoutCardProps) {
  const roundLabel = `${workout.rounds.length} ${workout.rounds.length === 1 ? 'round' : 'rounds'}`
  const estimate = formatClock(estimateWorkoutSeconds(workout))

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full min-h-[44px] cursor-pointer items-center gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/40 px-4 py-3.5 text-left transition-colors duration-200 hover:border-slate-700 hover:bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate font-condensed text-lg font-bold tracking-wide text-white uppercase">
          {workout.name}
        </span>
        <span className="mt-0.5 block text-sm text-slate-400 tabular-nums">
          {roundLabel} · ~{estimate}
        </span>
        <span className="mt-0.5 block text-[11px] font-condensed font-semibold tracking-[2px] text-slate-600 uppercase">
          {formatRelative(workout.lastUsedAt, now)}
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-600" aria-hidden="true" />
    </button>
  )
}

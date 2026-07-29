import { Timer } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
      <Timer className="h-10 w-10 text-slate-700" aria-hidden="true" />
      <p className="font-condensed text-lg font-bold tracking-wide text-slate-300">
        No workouts yet
      </p>
      <p className="max-w-[26ch] text-sm leading-relaxed text-slate-500">
        Tap + to build your first one
      </p>
    </div>
  )
}

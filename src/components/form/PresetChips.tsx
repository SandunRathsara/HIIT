import { cn } from '@/lib/utils'

interface PresetChipsProps {
  label: string
  values: readonly number[]
  value: number
  format: (value: number) => string
  onSelect: (value: number) => void
}

export function PresetChips({ label, values, value, format, onSelect }: PresetChipsProps) {
  return (
    <div
      className="flex w-full flex-nowrap items-center gap-2"
      role="group"
      aria-label={`${label} presets`}
    >
      {values.map(preset => {
        const active = preset === value
        return (
          <button
            key={preset}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(preset)}
            className={cn(
              'min-h-[44px] min-w-0 flex-1 cursor-pointer rounded-xl px-3',
              'font-condensed text-base font-semibold tabular-nums',
              'transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60',
              active
                ? 'bg-teal-500 text-slate-900'
                : 'border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200',
            )}
          >
            {format(preset)}
          </button>
        )
      })}
    </div>
  )
}

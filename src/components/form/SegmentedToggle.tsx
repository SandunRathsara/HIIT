import { cn } from '@/lib/utils'

interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedToggleProps<T extends string> {
  label: string
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function SegmentedToggle<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedToggleProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1"
    >
      {options.map(option => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'min-h-[44px] flex-1 cursor-pointer rounded-lg',
              'font-condensed text-sm font-bold tracking-[2px] uppercase',
              'transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60',
              active ? 'bg-teal-500 text-slate-900' : 'text-slate-500 hover:text-slate-300',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

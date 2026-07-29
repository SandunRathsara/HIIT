import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepperRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (value: number) => void
}

const stepBtn = cn(
  'flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full',
  'bg-slate-800 text-teal-400 transition-colors duration-200 hover:bg-slate-700',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60',
  'disabled:cursor-not-allowed disabled:opacity-25',
)

export function StepperRow({ label, value, min, max, step, display, onChange }: StepperRowProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-condensed text-[11px] font-semibold tracking-[3px] text-slate-500 uppercase">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          className={stepBtn}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - step))}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span
          aria-live="polite"
          className="min-w-[64px] text-center font-condensed text-lg font-bold text-white tabular-nums"
        >
          {display}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          className={stepBtn}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + step))}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

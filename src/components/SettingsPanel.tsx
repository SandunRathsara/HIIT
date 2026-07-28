import { Minus, Plus, Lock } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { HiitSettings } from '@/hooks/useHiitTimer'

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

interface SettingRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onDecrement: () => void
  onIncrement: () => void
  onChange: (v: number) => void
}

function SettingRow({ label, value, min, max, step, display, onDecrement, onIncrement, onChange }: SettingRowProps) {
  const btnBase = cn(
    'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150',
    'bg-slate-800 hover:bg-slate-700 text-teal-400 cursor-pointer active:scale-90',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50',
    'disabled:opacity-25 disabled:cursor-not-allowed disabled:active:scale-100'
  )

  return (
    <div className="mb-[clamp(8px,1.6dvh,20px)]">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[11px] font-condensed font-semibold tracking-[3px] uppercase text-slate-500">
          {label}
        </span>
        <div className="flex items-center gap-2.5">
          <button
            aria-label="−"
            className={btnBase}
            onClick={onDecrement}
            disabled={value <= min}
          >
            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <span className="font-condensed font-bold text-lg text-white min-w-[52px] text-center tabular-nums">
            {display}
          </span>
          <button
            aria-label="+"
            className={btnBase}
            onClick={onIncrement}
            disabled={value >= max}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="[&_[role=slider]]:bg-teal-400 [&_[role=slider]]:border-teal-400 [&_[role=slider]]:shadow-[0_0_6px_#14b8a666]"
      />
    </div>
  )
}

interface SettingsPanelProps {
  settings: HiitSettings
  isLocked: boolean
  onUpdate: <K extends keyof HiitSettings>(key: K, value: HiitSettings[K]) => void
}

export function SettingsPanel({ settings, isLocked, onUpdate }: SettingsPanelProps) {
  if (isLocked) {
    return (
      <div className="border-t border-slate-800/60 px-5 py-4 flex items-center justify-center gap-2.5 text-slate-600">
        <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <p className="text-[11px] font-condensed font-semibold tracking-[3px] uppercase">
          Settings locked during workout
        </p>
      </div>
    )
  }

  return (
    <div className="border-t border-slate-800/60 px-5 pt-[clamp(8px,1.6dvh,16px)] pb-[clamp(10px,2dvh,24px)]">
      <p className="text-[11px] font-condensed font-bold tracking-[3px] uppercase text-teal-500 mb-[clamp(6px,1.4dvh,16px)]">
        SETTINGS
      </p>

      <SettingRow
        label="WORK"
        value={settings.workTime}
        min={5} max={300} step={5}
        display={formatTime(settings.workTime)}
        onDecrement={() => onUpdate('workTime', Math.max(5, settings.workTime - 5))}
        onIncrement={() => onUpdate('workTime', Math.min(300, settings.workTime + 5))}
        onChange={v => onUpdate('workTime', v)}
      />
      <SettingRow
        label="REST"
        value={settings.restTime}
        min={5} max={300} step={5}
        display={formatTime(settings.restTime)}
        onDecrement={() => onUpdate('restTime', Math.max(5, settings.restTime - 5))}
        onIncrement={() => onUpdate('restTime', Math.min(300, settings.restTime + 5))}
        onChange={v => onUpdate('restTime', v)}
      />
      <SettingRow
        label="ROUNDS"
        value={settings.rounds}
        min={1} max={20} step={1}
        display={String(settings.rounds)}
        onDecrement={() => onUpdate('rounds', Math.max(1, settings.rounds - 1))}
        onIncrement={() => onUpdate('rounds', Math.min(20, settings.rounds + 1))}
        onChange={v => onUpdate('rounds', v)}
      />

      <div className="flex justify-between items-center mt-1">
        <span className="text-[11px] font-condensed font-semibold tracking-[3px] uppercase text-slate-500">
          PREPARE DELAY
        </span>
        <Switch
          checked={settings.prepareDelay}
          onCheckedChange={v => onUpdate('prepareDelay', v)}
        />
      </div>
    </div>
  )
}

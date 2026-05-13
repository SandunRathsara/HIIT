import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
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
  disabled: boolean
}

function SettingRow({ label, value, min, max, step, display, onDecrement, onIncrement, onChange, disabled }: SettingRowProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold tracking-widest uppercase text-gray-400">{label}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-teal-400 text-lg p-0"
            onClick={onDecrement}
            disabled={disabled || value <= min}
            aria-label="−"
          >
            −
          </Button>
          <span className="text-white font-bold font-mono text-lg min-w-[48px] text-center">
            {display}
          </span>
          <Button
            variant="ghost"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-teal-400 text-lg p-0"
            onClick={onIncrement}
            disabled={disabled || value >= max}
            aria-label="+"
          >
            +
          </Button>
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
        className="[&_.slider-track]:bg-slate-700 [&_.slider-range]:bg-teal-500"
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
      <div className="bg-slate-950 border-t border-slate-800 px-5 py-4 text-center">
        <p className="text-xs tracking-widest uppercase text-slate-600">
          Settings locked during workout
        </p>
      </div>
    )
  }

  return (
    <div className="bg-slate-950 border-t border-slate-800 px-5 pt-4 pb-5">
      <p className="text-xs font-bold tracking-widest uppercase text-teal-500 mb-4">SETTINGS</p>
      <SettingRow
        label="WORK"
        value={settings.workTime}
        min={5} max={300} step={5}
        display={formatTime(settings.workTime)}
        onDecrement={() => onUpdate('workTime', Math.max(5, settings.workTime - 5))}
        onIncrement={() => onUpdate('workTime', Math.min(300, settings.workTime + 5))}
        onChange={v => onUpdate('workTime', v)}
        disabled={false}
      />
      <SettingRow
        label="REST"
        value={settings.restTime}
        min={5} max={300} step={5}
        display={formatTime(settings.restTime)}
        onDecrement={() => onUpdate('restTime', Math.max(5, settings.restTime - 5))}
        onIncrement={() => onUpdate('restTime', Math.min(300, settings.restTime + 5))}
        onChange={v => onUpdate('restTime', v)}
        disabled={false}
      />
      <SettingRow
        label="ROUNDS"
        value={settings.rounds}
        min={1} max={20} step={1}
        display={String(settings.rounds)}
        onDecrement={() => onUpdate('rounds', Math.max(1, settings.rounds - 1))}
        onIncrement={() => onUpdate('rounds', Math.min(20, settings.rounds + 1))}
        onChange={v => onUpdate('rounds', v)}
        disabled={false}
      />
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs font-bold tracking-widest uppercase text-gray-400">PREPARE DELAY</span>
        <Switch
          checked={settings.prepareDelay}
          onCheckedChange={v => onUpdate('prepareDelay', v)}
        />
      </div>
    </div>
  )
}

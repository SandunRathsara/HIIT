import { X } from 'lucide-react'
import { LIMITS, PRESETS, type RoundMode } from '@/db/schema'
import { StepperRow } from '@/components/form/StepperRow'
import { PresetChips } from '@/components/form/PresetChips'
import { SegmentedToggle } from '@/components/form/SegmentedToggle'
import { TextField } from '@/components/form/TextField'
import { formatClock } from '@/lib/duration'

export interface RoundDraft {
  key: number
  exercise: string
  mode: RoundMode
  value: number
  secondsPerRep: number
  restTime: number
}

const MODE_OPTIONS = [
  { value: 'time' as const, label: 'Time' },
  { value: 'reps' as const, label: 'Reps' },
]

interface RoundCardProps {
  draft: RoundDraft
  index: number
  canRemove: boolean
  onChange: (next: RoundDraft) => void
  onRemove: () => void
}

export function RoundCard({ draft, index, canRemove, onChange, onRemove }: RoundCardProps) {
  const set = (patch: Partial<RoundDraft>) => onChange({ ...draft, ...patch })
  const isReps = draft.mode === 'reps'
  const valueLimits = isReps ? LIMITS.reps : LIMITS.workTime

  /** Switching mode has to move `value` into the other unit's range. */
  function setMode(mode: RoundMode) {
    if (mode === draft.mode) return
    set({ mode, value: mode === 'reps' ? PRESETS.reps[1] : PRESETS.workTime[1] })
  }

  return (
    <li className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 font-condensed text-sm font-bold text-teal-400 tabular-nums">
          {index + 1}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          aria-label={`Remove round ${index + 1}`}
          disabled={!canRemove}
          onClick={onRemove}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-600 transition-colors duration-200 hover:bg-slate-800 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 disabled:cursor-not-allowed disabled:opacity-25"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <TextField
          id={`round-${draft.key}-exercise`}
          label="Exercise"
          value={draft.exercise}
          maxLength={LIMITS.exerciseNameChars}
          placeholder={`Round ${index + 1}`}
          onChange={exercise => set({ exercise })}
        />

        <div className="flex flex-col gap-4">
          <section
            aria-labelledby={`round-${draft.key}-work-heading`}
            className="border-t border-slate-800/70 pt-4"
          >
            <h3
              id={`round-${draft.key}-work-heading`}
              className="mb-3 font-condensed text-[11px] font-bold tracking-[3px] text-teal-500 uppercase"
            >
              Work
            </h3>

            <SegmentedToggle
              label={`Round ${index + 1} work mode`}
              options={MODE_OPTIONS}
              value={draft.mode}
              onChange={setMode}
            />

            <div className="mt-3 flex flex-col gap-2.5">
              <PresetChips
                label={isReps ? 'Reps' : 'Work'}
                values={isReps ? PRESETS.reps : PRESETS.workTime}
                value={draft.value}
                format={v => (isReps ? String(v) : `${v}s`)}
                onSelect={value => set({ value })}
              />
              <StepperRow
                label={isReps ? 'Reps' : 'Work'}
                value={draft.value}
                min={valueLimits.min}
                max={valueLimits.max}
                step={valueLimits.step}
                display={isReps ? `${draft.value}×` : `${draft.value}s`}
                onChange={value => set({ value })}
              />
            </div>

            {isReps && (
              <div className="mt-4 flex flex-col gap-1">
                <StepperRow
                  label="Pace"
                  value={draft.secondsPerRep}
                  min={LIMITS.secondsPerRep.min}
                  max={LIMITS.secondsPerRep.max}
                  step={LIMITS.secondsPerRep.step}
                  display={`${draft.secondsPerRep}s/rep`}
                  onChange={secondsPerRep => set({ secondsPerRep })}
                />
                <p className="text-right text-[11px] text-slate-600 tabular-nums">
                  ≈ {formatClock(draft.value * draft.secondsPerRep)} for this round
                </p>
              </div>
            )}
          </section>

          <section
            aria-labelledby={`round-${draft.key}-rest-heading`}
            className="border-t border-slate-800/70 pt-4"
          >
            <h3
              id={`round-${draft.key}-rest-heading`}
              className="mb-3 font-condensed text-[11px] font-bold tracking-[3px] text-teal-500 uppercase"
            >
              Rest
            </h3>

            <div className="flex flex-col gap-2.5">
              <PresetChips
                label="Rest"
                values={PRESETS.restTime}
                value={draft.restTime}
                format={v => `${v}s`}
                onSelect={restTime => set({ restTime })}
              />
              <StepperRow
                label="Rest"
                value={draft.restTime}
                min={LIMITS.restTime.min}
                max={LIMITS.restTime.max}
                step={LIMITS.restTime.step}
                display={`${draft.restTime}s`}
                onChange={restTime => set({ restTime })}
              />
            </div>
          </section>
        </div>
      </div>
    </li>
  )
}

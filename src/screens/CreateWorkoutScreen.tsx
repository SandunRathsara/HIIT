import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, Plus } from 'lucide-react'
import {
  DEFAULT_PREPARE_SECONDS,
  DEFAULT_ROUND,
  LIMITS,
  PRESETS,
  type PrepareSeconds,
} from '@/db/schema'
import { createWorkout } from '@/db/workoutRepo'
import { RoundCard, type RoundDraft } from '@/components/RoundCard'
import { TextField } from '@/components/form/TextField'
import { PresetChips } from '@/components/form/PresetChips'
import { Switch } from '@/components/ui/switch'
import { estimateWorkoutSeconds, formatClock } from '@/lib/duration'

let nextKey = 1
function newDraft(from?: RoundDraft): RoundDraft {
  // A new round inherits the previous round's shape — most workouts repeat it.
  const base = from ?? { ...DEFAULT_ROUND }
  return {
    key: nextKey++,
    exercise: '',
    mode: base.mode,
    value: base.value,
    secondsPerRep: base.secondsPerRep,
    restTime: base.restTime,
  }
}

export function CreateWorkoutScreen() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [prepareDelay, setPrepareDelay] = useState(true)
  const [prepareSeconds, setPrepareSeconds] = useState<PrepareSeconds>(DEFAULT_PREPARE_SECONDS)
  const [rounds, setRounds] = useState<RoundDraft[]>(() => [newDraft()])
  const [saving, setSaving] = useState(false)
  const listEndRef = useRef<HTMLDivElement>(null)

  const nameError = nameTouched && name.trim() === '' ? 'Give this workout a name' : undefined
  const canSave = name.trim() !== '' && rounds.length >= LIMITS.rounds.min && !saving

  const estimate = useMemo(
    () =>
      estimateWorkoutSeconds({
        prepareDelay,
        prepareSeconds,
        rounds: rounds.map((r, i) => ({ ...r, order: i + 1 })),
      }),
    [prepareDelay, prepareSeconds, rounds],
  )

  function addRound() {
    setRounds(prev => [...prev, newDraft(prev.at(-1))])
    requestAnimationFrame(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }))
  }

  async function save() {
    if (!canSave) {
      setNameTouched(true)
      return
    }
    setSaving(true)
    try {
      await createWorkout(
        {
          name: name.trim(),
          prepareDelay,
          prepareSeconds,
          rounds: rounds.map((round, i) => ({
            order: i + 1,
            exercise: round.exercise.trim(),
            mode: round.mode,
            value: round.value,
            secondsPerRep: round.secondsPerRep,
            restTime: round.restTime,
          })),
        },
        Date.now(),
      )
      navigate('/', { replace: true })
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="screen-scroll">
      <div className="mx-auto w-full max-w-sm px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <header className="mb-5 flex items-center gap-2">
          <button
            type="button"
            aria-label="Back to workouts"
            onClick={() => navigate('/')}
            className="-ml-2 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors duration-200 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <h1 className="font-condensed text-xs font-bold tracking-[5px] text-teal-400 uppercase select-none">
            New Workout
          </h1>
        </header>

        <section className="mb-6 flex flex-col gap-5">
          <TextField
            id="workout-name"
            label="Workout name"
            value={name}
            maxLength={LIMITS.workoutNameChars}
            placeholder="Morning Burn"
            error={nameError}
            onChange={value => {
              setName(value)
              setNameTouched(true)
            }}
          />

          <div className="flex flex-col gap-3">
            <div className="flex min-h-[44px] items-center justify-between">
              <label
                htmlFor="prepare-delay"
                className="font-condensed text-[11px] font-semibold tracking-[3px] text-slate-500 uppercase"
              >
                Prepare delay
              </label>
              <Switch
                id="prepare-delay"
                checked={prepareDelay}
                onCheckedChange={setPrepareDelay}
              />
            </div>
            {prepareDelay && (
              <PresetChips
                label="Prepare delay"
                values={PRESETS.prepareSeconds}
                value={prepareSeconds}
                format={v => `${v}s`}
                onSelect={v => setPrepareSeconds(v as PrepareSeconds)}
              />
            )}
          </div>
        </section>

        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-condensed text-[11px] font-bold tracking-[3px] text-teal-500 uppercase">
            Rounds
          </h2>
          <span className="text-[11px] text-slate-600 tabular-nums">
            {rounds.length} · ~{formatClock(estimate)}
          </span>
        </div>

        <ul className="flex flex-col gap-3">
          {rounds.map((draft, index) => (
            <RoundCard
              key={draft.key}
              draft={draft}
              index={index}
              canRemove={rounds.length > LIMITS.rounds.min}
              onChange={next => setRounds(prev => prev.map(r => (r.key === draft.key ? next : r)))}
              onRemove={() => setRounds(prev => prev.filter(r => r.key !== draft.key))}
            />
          ))}
        </ul>
        <div ref={listEndRef} />

        <button
          type="button"
          disabled={rounds.length >= LIMITS.rounds.max}
          onClick={addRound}
          className="mt-3 flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 font-condensed text-base font-semibold tracking-wider text-slate-400 uppercase transition-colors duration-200 hover:border-teal-500/60 hover:text-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Add round
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-800/60 bg-[#0d1b2a]/95 px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto w-full max-w-sm">
          <button
            type="button"
            disabled={!canSave}
            onClick={save}
            className="min-h-[56px] w-full cursor-pointer rounded-2xl bg-teal-500 font-condensed text-xl font-bold tracking-wider text-slate-900 uppercase transition-colors duration-200 hover:bg-teal-400 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100"
          >
            {saving ? 'Saving…' : 'Save workout'}
          </button>
        </div>
      </div>
    </div>
  )
}

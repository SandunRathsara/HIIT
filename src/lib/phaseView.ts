import type { Round } from '@/db/schema'
import type { Phase } from '@/hooks/useWorkoutTimer'
import { roundExerciseLabel, roundTargetLabel } from './duration'

export interface PhaseView {
  /** Small tracked label above the ring, e.g. WORK. */
  label: string
  /** Tiny word inside the ring above the name, e.g. NEXT. Null when unused. */
  kicker: string | null
  /** The big text inside the ring. */
  ringText: string
  /** Muted line under the ring. Null when unused. */
  subline: string | null
  /** False for a reps round, where a count-up replaces the countdown. */
  showsClock: boolean
}

export interface PhaseViewInput {
  phase: Phase
  currentRound: Round | null
  nextRound: Round | null
}

const COOLDOWN_RING_TEXT = 'WALK IT OFF'
const COOLDOWN_SUBLINE = "Keep moving — don't sit down"

export function describePhase({ phase, currentRound, nextRound }: PhaseViewInput): PhaseView {
  switch (phase) {
    case 'prep':
      return {
        label: 'GET READY',
        kicker: null,
        ringText: 'GET READY',
        subline: currentRound ? roundExerciseLabel(currentRound) : null,
        showsClock: true,
      }

    case 'work': {
      const isReps = currentRound?.mode === 'reps'
      return {
        label: 'WORK',
        kicker: null,
        ringText: currentRound ? roundExerciseLabel(currentRound).toUpperCase() : 'WORK',
        subline: isReps && currentRound ? roundTargetLabel(currentRound) : null,
        showsClock: !isReps,
      }
    }

    case 'rest':
      return {
        label: 'REST',
        kicker: 'NEXT',
        ringText: nextRound ? roundExerciseLabel(nextRound).toUpperCase() : 'REST',
        subline: nextRound ? roundTargetLabel(nextRound) : null,
        showsClock: true,
      }

    case 'cooldown':
      return {
        label: 'COOL DOWN',
        kicker: null,
        ringText: COOLDOWN_RING_TEXT,
        subline: COOLDOWN_SUBLINE,
        showsClock: true,
      }

    case 'done':
      return { label: 'COMPLETE', kicker: null, ringText: 'COMPLETE', subline: null, showsClock: false }

    case 'idle':
    default:
      return { label: 'READY', kicker: null, ringText: 'READY', subline: null, showsClock: true }
  }
}

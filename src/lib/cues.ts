import type { Round } from '@/db/schema'

export type CueEvent =
  | { type: 'prep'; round: Round }
  | { type: 'work'; round: Round }
  | { type: 'rest'; nextRound: Round }
  | { type: 'cooldown' }
  | { type: 'done' }
  | { type: 'countdown'; seconds: number }

function spokenName(round: Round): string {
  return round.exercise.trim()
}

function repsPhrase(round: Round): string {
  return `${round.value} ${round.value === 1 ? 'rep' : 'reps'}.`
}

export function buildCue(event: CueEvent): string {
  switch (event.type) {
    case 'prep': {
      const name = spokenName(event.round)
      return name === '' ? 'Get ready.' : `Get ready. ${name}.`
    }
    case 'work': {
      const name = spokenName(event.round)
      if (event.round.mode === 'reps') {
        return name === '' ? repsPhrase(event.round) : `${name}. ${repsPhrase(event.round)}`
      }
      return name === '' ? 'Work!' : `${name}!`
    }
    case 'rest': {
      const name = spokenName(event.nextRound)
      return name === '' ? 'Rest.' : `Rest. Next, ${name}.`
    }
    case 'cooldown':
      return 'Cool down. Walk it off.'
    case 'done':
      return 'Workout complete!'
    case 'countdown':
      return String(event.seconds)
  }
}

/** No-ops where the Web Speech API is unavailable (e.g. jsdom). */
export function speak(text: string): void {
  if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') return
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
}

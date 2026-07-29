import {
  CircularProgress,
  CircularProgressIndicator,
  CircularProgressTrack,
  CircularProgressRange,
  CircularProgressValueText,
} from '@/components/ui/circular-progress'
import { cn } from '@/lib/utils'
import { formatCountdown } from '@/lib/duration'
import type { Phase } from '@/hooks/useWorkoutTimer'
import type { PhaseView } from '@/lib/phaseView'

interface TimerDisplayProps {
  phase: Phase
  view: PhaseView
  timeLeft: number
  elapsed: number
  repsTarget: number | null
  currentRound: number
  totalRounds: number
  phaseTotal: number
}

export const RING_COLOR: Record<Phase, string> = {
  idle: '#475569',
  prep: '#FBBF24',
  work: '#F97316',
  rest: '#60A5FA',
  cooldown: '#22D3EE',
  done: '#34D399',
}

const PHASE_TEXT_COLOR: Record<Phase, string> = {
  idle: 'text-slate-400',
  prep: 'text-amber-400',
  work: 'text-orange-400',
  rest: 'text-blue-400',
  cooldown: 'text-cyan-400',
  done: 'text-emerald-400',
}

export function TimerDisplay({
  phase,
  view,
  timeLeft,
  elapsed,
  repsTarget,
  currentRound,
  totalRounds,
  phaseTotal,
}: TimerDisplayProps) {
  const color = RING_COLOR[phase]
  const isActive = phase !== 'idle' && phase !== 'done'
  const isCountdown = view.showsClock && timeLeft <= 3 && timeLeft > 0 && isActive
  const pct = phaseTotal > 0 ? ((phaseTotal - timeLeft) / phaseTotal) * 100 : 100

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center gap-2 select-none">
      <div
        className={cn(
          'flex shrink-0 items-center gap-2 font-condensed text-xs font-bold tracking-[4px] uppercase',
          PHASE_TEXT_COLOR[phase],
        )}
      >
        {isActive && (
          <span
            className="h-2 w-2 rounded-full animate-pulse"
            style={{ backgroundColor: color }}
          />
        )}
        {view.label}
      </div>

      <div className="flex min-h-0 w-full flex-1 items-center justify-center [container-type:size]">
        <CircularProgress
          value={pct}
          min={0}
          max={100}
          size={260}
          thickness={10}
          className="aspect-square max-w-full [container-type:size]"
          style={{ width: 'min(100cqw, 100cqh)' }}
        >
          <CircularProgressIndicator className="h-full w-full">
            <CircularProgressTrack style={{ color: '#1e2d3d' }} />
            <CircularProgressRange
              className={cn(!view.showsClock && 'ring-breathe')}
              style={{
                color,
                filter: isActive ? `drop-shadow(0 0 8px ${color}88)` : 'none',
                transition: 'stroke-dashoffset 1s linear, color 0.4s ease',
              }}
            />
          </CircularProgressIndicator>

          <CircularProgressValueText>
            <span className="flex flex-col items-center justify-center gap-0.5 px-[12cqmin] text-center">
              {view.kicker && (
                <span
                  className="font-condensed text-[10px] font-bold tracking-[4px] uppercase"
                  style={{ fontSize: 'clamp(9px, 5cqmin, 13px)', color }}
                >
                  {view.kicker}
                </span>
              )}

              <span
                className="line-clamp-2 font-condensed font-bold tracking-tight text-white uppercase"
                style={{ fontSize: 'clamp(13px, 10cqmin, 26px)', lineHeight: 1.05 }}
              >
                {view.ringText}
              </span>

              {view.showsClock ? (
                <span
                  className={cn(
                    'font-condensed font-black leading-none tracking-tight text-white tabular-nums',
                    isCountdown && 'countdown-pulse',
                  )}
                  style={{ fontSize: 'clamp(28px, 24cqmin, 62px)' }}
                >
                  {formatCountdown(timeLeft)}
                </span>
              ) : (
                <span
                  className="font-condensed font-black leading-none text-white tabular-nums"
                  style={{ fontSize: 'clamp(28px, 24cqmin, 62px)' }}
                >
                  {repsTarget ?? 0}
                </span>
              )}

              {!view.showsClock && (
                <span
                  className="font-condensed font-semibold tracking-[3px] text-slate-400 uppercase tabular-nums"
                  style={{ fontSize: 'clamp(9px, 5cqmin, 13px)' }}
                >
                  {formatCountdown(elapsed)} elapsed
                </span>
              )}
            </span>
          </CircularProgressValueText>
        </CircularProgress>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1">
        {view.subline && (
          <span className="max-w-[30ch] truncate text-center text-xs text-slate-400">
            {view.subline}
          </span>
        )}

        <span className="font-condensed text-xs font-semibold tracking-widest text-slate-500 uppercase tabular-nums">
          Round {currentRound} / {totalRounds}
        </span>

        {totalRounds > 1 && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalRounds }, (_, i) => {
              const done = phase === 'done' || i < currentRound - 1
              const active = isActive && i === currentRound - 1
              return (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: active ? '10px' : '6px',
                    height: active ? '10px' : '6px',
                    backgroundColor: done || active ? color : '#1e2d3d',
                    boxShadow: active ? `0 0 6px ${color}` : 'none',
                  }}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

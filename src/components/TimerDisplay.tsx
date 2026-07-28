import {
  CircularProgress,
  CircularProgressIndicator,
  CircularProgressTrack,
  CircularProgressRange,
  CircularProgressValueText,
} from '@/components/ui/circular-progress'
import { cn } from '@/lib/utils'
import type { Phase } from '@/hooks/useHiitTimer'

interface TimerDisplayProps {
  phase: Phase
  timeLeft: number
  currentRound: number
  totalRounds: number
  totalTime?: number
}

const RING_COLOR: Record<Phase, string> = {
  idle: '#475569',
  prep: '#FBBF24',
  work: '#F97316',
  rest: '#60A5FA',
  done: '#34D399',
}

const PHASE_TEXT_COLOR: Record<Phase, string> = {
  idle: 'text-slate-400',
  prep: 'text-amber-400',
  work: 'text-orange-400',
  rest: 'text-blue-400',
  done: 'text-emerald-400',
}

const PHASE_LABELS: Record<Phase, string> = {
  idle: 'READY',
  prep: 'GET READY',
  work: 'WORK',
  rest: 'REST',
  done: 'DONE!',
}

export function TimerDisplay({ phase, timeLeft, currentRound, totalRounds, totalTime = 0 }: TimerDisplayProps) {
  const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0')
  const ss = (timeLeft % 60).toString().padStart(2, '0')

  const pct = phase === 'done'
    ? 100
    : totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0

  const color = RING_COLOR[phase]
  const isCountdown = timeLeft <= 3 && timeLeft > 0 && phase !== 'idle' && phase !== 'done'
  const isActive = phase !== 'idle' && phase !== 'done'

  return (
    <div className="flex flex-col items-center gap-2 select-none w-full h-full min-h-0">

      {/* Phase label */}
      <div className={cn('shrink-0 flex items-center gap-2 font-condensed font-bold text-xs tracking-[4px] uppercase', PHASE_TEXT_COLOR[phase])}>
        {isActive && (
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: color }}
          />
        )}
        {PHASE_LABELS[phase]}
      </div>

      {/* Ring + clock — fills all leftover vertical space, stays square */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center [container-type:size]">
        <CircularProgress
          value={pct}
          min={0}
          max={100}
          size={260}
          thickness={10}
          className="aspect-square max-w-full [container-type:size]"
          style={{ width: 'min(100cqw, 100cqh)' }}
        >
          <CircularProgressIndicator className="w-full h-full">
            <CircularProgressTrack style={{ color: '#1e2d3d' }} />
            <CircularProgressRange
              style={{
                color,
                filter: phase !== 'idle' ? `drop-shadow(0 0 8px ${color}88)` : 'none',
                transition: 'stroke-dashoffset 1s linear, color 0.4s ease',
              }}
            />
          </CircularProgressIndicator>
          <CircularProgressValueText>
            <span
              className={cn(
                'font-condensed font-black text-white leading-none tracking-tight tabular-nums',
                isCountdown && 'countdown-pulse'
              )}
              style={{ fontSize: 'clamp(36px, 30cqmin, 80px)' }}
            >
              {mm}:{ss}
            </span>
          </CircularProgressValueText>
        </CircularProgress>
      </div>

      {/* Round info + dots */}
      <div className="shrink-0 flex flex-col items-center gap-1.5">
        <span className="text-xs font-condensed font-semibold tracking-widest uppercase text-slate-500">
          {phase !== 'idle'
            ? `ROUND ${currentRound} / ${totalRounds}`
            : `${totalRounds} ROUNDS`}
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

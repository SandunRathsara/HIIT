import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { Trash2 } from 'lucide-react'

const REVEAL_PX = 88
const AXIS_LOCK_PX = 10

interface SwipeToDeleteProps {
  onDelete: () => void
  deleteLabel: string
  children: ReactNode
}

export function SwipeToDelete({ onDelete, deleteLabel, children }: SwipeToDeleteProps) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const origin = useRef<{ x: number; y: number; offset: number } | null>(null)
  const axis = useRef<'none' | 'x' | 'y'>('none')

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    origin.current = { x: e.clientX, y: e.clientY, offset }
    axis.current = 'none'
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const start = origin.current
    if (!start) return

    const dx = e.clientX - start.x
    const dy = e.clientY - start.y

    // Only claim the gesture once it is clearly horizontal — otherwise the
    // list must stay free to scroll vertically.
    if (axis.current === 'none') {
      if (Math.abs(dx) > AXIS_LOCK_PX && Math.abs(dx) > Math.abs(dy)) {
        axis.current = 'x'
        setDragging(true)
        e.currentTarget.setPointerCapture(e.pointerId)
      } else if (Math.abs(dy) > AXIS_LOCK_PX) {
        axis.current = 'y'
      }
      return
    }

    if (axis.current !== 'x') return
    setOffset(Math.min(0, Math.max(-REVEAL_PX, start.offset + dx)))
  }

  function onPointerUp() {
    if (axis.current === 'x') setOffset(offset < -REVEAL_PX / 2 ? -REVEAL_PX : 0)
    origin.current = null
    axis.current = 'none'
    setDragging(false)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <button
        type="button"
        aria-label={deleteLabel}
        onClick={() => {
          setOffset(0)
          onDelete()
        }}
        className="absolute inset-y-0 right-0 flex w-[88px] cursor-pointer items-center justify-center rounded-r-2xl bg-red-600 text-white transition-colors duration-200 hover:bg-red-500 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-400"
      >
        <Trash2 className="h-5 w-5" aria-hidden="true" />
      </button>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        // Suppress the click that follows a swipe so it does not open the workout.
        onClickCapture={e => {
          if (offset !== 0) {
            e.preventDefault()
            e.stopPropagation()
            setOffset(0)
          }
        }}
        style={{ transform: `translateX(${offset}px)` }}
        className={`relative touch-pan-y ${dragging ? '' : 'transition-transform duration-200 ease-out'}`}
      >
        {children}
      </div>
    </div>
  )
}

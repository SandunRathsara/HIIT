import { useEffect, useRef } from 'react'

interface ConfirmSheetProps {
  open: boolean
  title: string
  body?: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmSheet({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) confirmRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  const confirmStyle =
    tone === 'danger'
      ? 'bg-red-500 hover:bg-red-400 text-white'
      : 'bg-teal-500 hover:bg-teal-400 text-slate-900'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm rounded-t-3xl border-t border-slate-800 bg-[#111f30] px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <p className="text-center font-condensed text-xl font-bold tracking-wide text-white uppercase">
          {title}
        </p>
        {body && <p className="mt-2 text-center text-sm text-slate-400">{body}</p>}

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`min-h-[52px] w-full cursor-pointer rounded-2xl font-condensed text-lg font-bold tracking-wider uppercase transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${confirmStyle}`}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[52px] w-full cursor-pointer rounded-2xl border border-slate-700 font-condensed text-lg font-semibold tracking-wider text-slate-300 uppercase transition-colors duration-200 hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

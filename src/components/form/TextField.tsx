import { cn } from '@/lib/utils'

interface TextFieldProps {
  id: string
  label: string
  value: string
  maxLength: number
  placeholder?: string
  error?: string
  onChange: (value: string) => void
}

export function TextField({
  id,
  label,
  value,
  maxLength,
  placeholder,
  error,
  onChange,
}: TextFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={id}
          className="font-condensed text-[11px] font-semibold tracking-[3px] text-slate-500 uppercase"
        >
          {label}
        </label>
        <span className="text-[11px] text-slate-600 tabular-nums">
          {value.length}/{maxLength}
        </span>
      </div>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={e => onChange(e.target.value)}
        className={cn(
          'min-h-[48px] w-full rounded-xl border bg-slate-900/60 px-3.5',
          'font-sans text-base text-white placeholder:text-slate-600',
          'transition-colors duration-200 focus:outline-none focus:ring-2',
          error
            ? 'border-red-500/70 focus:ring-red-400/60'
            : 'border-slate-800 focus:border-teal-500/60 focus:ring-teal-400/50',
        )}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

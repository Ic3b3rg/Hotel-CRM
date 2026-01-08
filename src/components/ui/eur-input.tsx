import * as React from 'react'
import { cn } from '@/lib/utils'

// Format number with Italian thousands separator (dot)
function formatEur(value: number | string | undefined): string {
  if (value === undefined || value === null || value === '') return ''
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return ''
  // Use Italian locale for thousands separator (.)
  return num.toLocaleString('it-IT', { maximumFractionDigits: 0 })
}

// Parse formatted string back to number
function parseEur(value: string): number | undefined {
  if (!value || value.trim() === '') return undefined
  // Remove all dots (thousands separators) and replace comma with dot for decimals
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? undefined : num
}

interface EurInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'> {
  value: number | undefined
  onChange: (value: number | undefined) => void
}

function EurInput({ className, value, onChange, ...props }: EurInputProps) {
  const [displayValue, setDisplayValue] = React.useState(() => formatEur(value))
  const [isFocused, setIsFocused] = React.useState(false)

  // Sync display value when external value changes (and not focused)
  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatEur(value))
    }
  }, [value, isFocused])

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    // On focus, show raw number for easier editing
    if (value !== undefined) {
      setDisplayValue(value.toString())
    }
    props.onFocus?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    // On blur, format the value
    const parsed = parseEur(displayValue)
    onChange(parsed)
    setDisplayValue(formatEur(parsed))
    props.onBlur?.(e)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Allow only digits and empty string while typing
    if (inputValue === '' || /^[0-9]*$/.test(inputValue)) {
      setDisplayValue(inputValue)
      // Update the form value immediately
      const parsed = inputValue === '' ? undefined : parseInt(inputValue, 10)
      onChange(isNaN(parsed as number) ? undefined : parsed)
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  )
}

export { EurInput, formatEur, parseEur }

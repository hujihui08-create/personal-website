import { useState, useEffect, useRef } from 'react'
import type { Slot } from '@/types'

interface TimePickerProps {
  value?: string
  onChange?: (time: string) => void
  slots?: Slot[]
  loading?: boolean
  isAvailable?: boolean
  message?: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const TimePicker = ({
  value,
  onChange,
  slots = [],
  loading = false,
  isAvailable = true,
  message,
  placeholder = '请选择时段',
  className = '',
  disabled = false
}: TimePickerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTimeSelect = (time: string) => {
    onChange?.(time)
    setIsOpen(false)
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getDisplayText = () => {
    if (!value) return ''
    const slot = slots.find(s => s.time === value)
    if (slot) {
      return slot.time + (!slot.available && slot.reason ? ` - ${slot.reason}` : '')
    }
    return value
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        readOnly
        value={getDisplayText()}
        placeholder={placeholder}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 border border-[var(--color-border-light)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all cursor-pointer ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-2 bg-white rounded-[var(--radius-md)] shadow-lg border border-[var(--color-border-light)] p-4 min-w-[280px] max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-accent)]"></div>
            </div>
          ) : !isAvailable ? (
            <div className="text-center py-8 text-[var(--color-secondary)]">
              <p>{message}</p>
            </div>
          ) : slots.length > 0 ? (
            <div className="space-y-2">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && handleTimeSelect(slot.time)}
                  disabled={!slot.available}
                  className={`
                    w-full px-4 py-3 rounded-[var(--radius-md)] border text-left font-medium transition-all
                    ${value === slot.time
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                      : slot.available
                      ? 'bg-white text-[var(--color-primary)] border-[var(--color-border-light)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span>{slot.time}</span>
                    {value === slot.time && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {!slot.available && slot.reason && (
                    <div className="text-xs mt-1 opacity-75">{slot.reason}</div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--color-secondary)]">
              <p>暂无可用时段</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

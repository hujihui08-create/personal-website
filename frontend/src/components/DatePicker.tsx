import { useState, useEffect, useRef } from 'react'

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  minDate?: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const DatePicker = ({
  value,
  onChange,
  minDate,
  placeholder = '请选择日期',
  className = '',
  disabled = false
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }
    return date.toLocaleDateString('zh-CN', options)
  }

  const isSameDay = (d1: Date, d2: Date): boolean => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate()
  }

  const isBeforeMinDate = (date: Date): boolean => {
    if (!minDate) return false
    const min = new Date(minDate)
    min.setHours(0, 0, 0, 0)
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d < min
  }

  const isWeekend = (date: Date): boolean => {
    const day = date.getDay()
    return day === 0 || day === 6
  }

  const getDaysInMonth = (date: Date): Date[] => {
    const days: Date[] = []
    const year = date.getFullYear()
    const month = date.getMonth()
    
    // Get first day of the month
    const firstDay = new Date(year, month, 1)
    // Get last day of the month
    const lastDay = new Date(year, month + 1, 0)
    
    // Add days from previous month
    const startDay = firstDay.getDay()
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i))
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    // Add days from next month to complete the grid (6 rows)
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i))
    }
    
    return days
  }

  const handleDateSelect = (date: Date) => {
    if (isBeforeMinDate(date) || isWeekend(date)) return
    const dateStr = formatDate(date)
    onChange?.(dateStr)
    setIsOpen(false)
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
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

  const days = getDaysInMonth(currentMonth)
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                      '七月', '八月', '九月', '十月', '十一月', '十二月']

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        readOnly
        value={value ? formatDateDisplay(value) : ''}
        placeholder={placeholder}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 border border-[var(--color-border-light)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all cursor-pointer ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-2 bg-white rounded-[var(--radius-md)] shadow-lg border border-[var(--color-border-light)] p-4 min-w-[320px]">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-[var(--color-bg)] rounded-[var(--radius-md)] transition-colors"
            >
              <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-medium text-[var(--color-primary)]">
              {currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-[var(--color-bg)] rounded-[var(--radius-md)] transition-colors"
            >
              <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`text-center text-sm font-medium py-2 ${index === 0 || index === 6 ? 'text-gray-400' : 'text-[var(--color-secondary)]'}`}
              >
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
              const isSelected = value ? isSameDay(date, new Date(value)) : false
              const isDisabled = !isCurrentMonth || isBeforeMinDate(date) || isWeekend(date)
              const isToday = isSameDay(date, new Date())
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(date)}
                  disabled={isDisabled}
                  className={`
                    w-10 h-10 rounded-[var(--radius-md)] text-sm font-medium transition-all flex items-center justify-center
                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                    ${isWeekend(date) && isCurrentMonth ? 'text-gray-400' : ''}
                    ${isBeforeMinDate(date) && isCurrentMonth ? 'text-gray-400 cursor-not-allowed' : ''}
                    ${isSelected ? 'bg-[var(--color-accent)] text-white' : ''}
                    ${isToday && !isSelected ? 'border-2 border-[var(--color-accent)] text-[var(--color-accent)]' : ''}
                    ${!isDisabled && !isSelected && isCurrentMonth ? 'hover:bg-[var(--color-bg)] text-[var(--color-primary)]' : ''}
                    ${isDisabled && !isCurrentMonth ? 'cursor-default' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-[var(--color-border-light)] text-xs text-[var(--color-secondary)]">
            <p>• 周末不可预约</p>
          </div>
        </div>
      )}
    </div>
  )
}

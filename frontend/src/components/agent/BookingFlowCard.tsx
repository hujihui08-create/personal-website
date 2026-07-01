import { useState, useEffect } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import { bookingApi } from '@/api/booking'
import type { BookingFormData, BookingResultData, Slot } from '@/types'

// ── Types ────────────────────────────────────────────────────────────────────

interface BookingFlowCardProps {
  lastBookingInfo?: Partial<BookingFormData>
  onClose?: () => void
}

type Step = 'date_time' | 'info' | 'result'

// ── Helpers ──────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const getNextWorkday = (): Date => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1)
  }
  return d
}

const formatDate = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const generateDateOptions = (): {
  date: Date
  label: string
  weekday: string
  isWeekend: boolean
}[] => {
  const today = new Date()
  const options = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dayOfWeek = d.getDay()
    options.push({
      date: d,
      label: formatDate(d),
      weekday: WEEKDAY_LABELS[dayOfWeek],
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    })
  }
  return options
}

// ── Component ────────────────────────────────────────────────────────────────

export const BookingFlowCard = ({ lastBookingInfo, onClose }: BookingFlowCardProps) => {
  // ── State ────────────────────────────────────────────────────────────────

  const [step, setStep] = useState<Step>('date_time')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState<BookingResultData | undefined>(undefined)

  const [formData, setFormData] = useState<BookingFormData>({
    company_name: '',
    company_location: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    notes: '',
  })

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({})

  const dateOptions = generateDateOptions()

  // ── Set default selected date to next workday (only once on mount) ──────

  useEffect(() => {
    const nextWorkday = getNextWorkday()
    setSelectedDate(formatDate(nextWorkday))
  }, [])

  // ── Pre-fill lastBookingInfo when entering info step ─────────────────────

  useEffect(() => {
    if (step === 'info' && lastBookingInfo) {
      setFormData((prev) => ({
        ...prev,
        company_name: lastBookingInfo.company_name ?? prev.company_name,
        company_location: lastBookingInfo.company_location ?? prev.company_location,
        contact_name: lastBookingInfo.contact_name ?? prev.contact_name,
        contact_phone: lastBookingInfo.contact_phone ?? prev.contact_phone,
        contact_email: lastBookingInfo.contact_email ?? prev.contact_email,
        notes: lastBookingInfo.notes ?? prev.notes,
      }))
    }
  }, [step, lastBookingInfo])

  // ── Fetch slots when selectedDate changes ───────────────────────────────

  useEffect(() => {
    if (!selectedDate) return

    const loadSlots = async () => {
      setSlotsLoading(true)
      setSlotsError('')
      setSelectedTime('')
      try {
        const res = await bookingApi.getSlots(selectedDate)
        setSlots(res.data.slots ?? [])
      } catch {
        setSlotsError('加载时段失败，请稍后重试')
        setSlots([])
      } finally {
        setSlotsLoading(false)
      }
    }
    loadSlots()
  }, [selectedDate])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
  }

  const handleConfirmTime = () => {
    if (!selectedDate || !selectedTime) return
    setStep('info')
  }

  const handleBackToDateTime = () => {
    setStep('date_time')
    setSubmitError('')
    setFormErrors({})
  }

  const handleFormChange = (field: keyof BookingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof BookingFormData, string>> = {}

    if (!formData.company_name.trim()) {
      errors.company_name = '请输入公司名称'
    }
    if (!formData.company_location.trim()) {
      errors.company_location = '请输入公司地点'
    }
    if (!formData.contact_name.trim()) {
      errors.contact_name = '请输入联系人姓名'
    }
    if (!formData.contact_phone.trim()) {
      errors.contact_phone = '请输入手机号'
    } else if (!/^\d{11}$/.test(formData.contact_phone.trim())) {
      errors.contact_phone = '请输入11位手机号'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    setSubmitError('')

    try {
      const res = await bookingApi.createBooking({
        company_name: formData.company_name.trim(),
        company_location: formData.company_location.trim(),
        booking_date: selectedDate,
        booking_time: selectedTime,
        contact_name: formData.contact_name.trim(),
        contact_phone: formData.contact_phone.trim(),
        contact_email: formData.contact_email.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      })

      const booking = res.data
      setResult({
        id: booking.id,
        status: booking.status,
        company_name: booking.company_name,
        company_location: booking.company_location,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        contact_name: booking.contact_name,
        contact_phone: booking.contact_phone,
        contact_email: booking.contact_email,
        notes: booking.notes,
        created_at: booking.created_at,
      })
      setStep('result')
    } catch {
      setSubmitError('预约提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Helpers for display ──────────────────────────────────────────────────

  const selectedDateOption = dateOptions.find((d) => d.label === selectedDate)
  const displayDateStr = selectedDateOption
    ? `${selectedDate} ${selectedDateOption.weekday}`
    : selectedDate
  const isToday = (label: string) => label === formatDate(new Date())

  // ── Render: Step date_time ───────────────────────────────────────────────

  const renderDateTimeStep = () => (
    <div className="space-y-4">
      {/* Title */}
      <h3 className="text-sm font-semibold text-[var(--color-primary)]">选择预约时间</h3>

      {/* Date Picker */}
      <div>
        <p className="text-xs text-[var(--color-secondary)] mb-2">选择日期</p>
        <div className="flex gap-1.5">
          {dateOptions.map((option) => (
            <button
              key={option.label}
              disabled={option.isWeekend}
              onClick={() => handleDateSelect(option.label)}
              className={`flex-1 flex flex-col items-center py-2 rounded-[var(--radius-md)] text-xs transition-colors duration-[var(--duration-fast)]
                ${
                  option.isWeekend
                    ? 'cursor-not-allowed text-[var(--color-secondary)]/40 bg-[var(--color-bg-secondary)]/40'
                    : ''
                }
                ${
                  !option.isWeekend && selectedDate === option.label
                    ? 'bg-[var(--color-primary)] text-white'
                    : !option.isWeekend
                      ? 'border border-[var(--color-border-light)] text-[var(--color-primary)] hover:border-[var(--color-accent)]'
                      : ''
                }
              `}
            >
              <span
                className={`text-[10px] ${
                  selectedDate === option.label && !option.isWeekend
                    ? 'text-white/70'
                    : 'text-[var(--color-secondary)]'
                }`}
              >
                {isToday(option.label) ? '今天' : option.weekday}
              </span>
              <span className="font-medium">{option.date.getDate()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      <div>
        <p className="text-xs text-[var(--color-secondary)] mb-2">选择时段</p>
        {slotsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 text-[var(--color-secondary)] animate-spin" />
            <span className="ml-2 text-xs text-[var(--color-secondary)]">加载时段中...</span>
          </div>
        ) : slotsError ? (
          <p className="text-xs text-[var(--color-error)] py-2">{slotsError}</p>
        ) : slots.length === 0 ? (
          <p className="text-xs text-[var(--color-secondary)] py-2">该日期暂无可用时段</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot.time}
                disabled={!slot.available}
                onClick={() => handleTimeSelect(slot.time)}
                className={`px-3 py-2 text-xs border rounded-[var(--radius-md)] transition-colors duration-[var(--duration-fast)]
                  ${
                    !slot.available
                      ? 'bg-[var(--color-bg-secondary)] text-[var(--color-secondary)] cursor-not-allowed opacity-50'
                      : selectedTime === slot.time
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                        : 'border-[var(--color-border-light)] text-[var(--color-primary)] hover:border-[var(--color-accent)]'
                  }
                `}
              >
                {slot.time}
                {!slot.available && <span className="block text-[10px] opacity-70">已约满</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Button */}
      <button
        disabled={!selectedDate || !selectedTime}
        onClick={handleConfirmTime}
        className="w-full py-2.5 bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-secondary)] transition-colors duration-[var(--duration-fast)] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        确认时间
      </button>
    </div>
  )

  // ── Render: Step info ────────────────────────────────────────────────────

  const renderInfoStep = () => (
    <div className="space-y-4">
      {/* Header with selected datetime & modify button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-primary)]">填写预约信息</h3>
          <p className="text-xs text-[var(--color-secondary)] mt-1">
            {displayDateStr} {selectedTime}
          </p>
        </div>
        <button
          onClick={handleBackToDateTime}
          className="text-xs text-[var(--color-accent)] hover:underline"
        >
          修改
        </button>
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        {/* Company Name */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-primary)] mb-1">
            公司名称 <span className="text-[var(--color-error)]">*</span>
          </label>
          <input
            type="text"
            value={formData.company_name}
            onChange={(e) => handleFormChange('company_name', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[var(--color-border-light)] rounded-[var(--radius-md)] bg-[var(--color-bg)] text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="请输入公司名称"
          />
          {formErrors.company_name && (
            <p className="text-xs text-[var(--color-error)] mt-1">{formErrors.company_name}</p>
          )}
        </div>

        {/* Company Location */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-primary)] mb-1">
            公司地点 <span className="text-[var(--color-error)]">*</span>
          </label>
          <input
            type="text"
            value={formData.company_location}
            onChange={(e) => handleFormChange('company_location', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[var(--color-border-light)] rounded-[var(--radius-md)] bg-[var(--color-bg)] text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="请输入公司地点"
          />
          {formErrors.company_location && (
            <p className="text-xs text-[var(--color-error)] mt-1">{formErrors.company_location}</p>
          )}
        </div>

        {/* Contact Name */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-primary)] mb-1">
            联系人姓名 <span className="text-[var(--color-error)]">*</span>
          </label>
          <input
            type="text"
            value={formData.contact_name}
            onChange={(e) => handleFormChange('contact_name', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[var(--color-border-light)] rounded-[var(--radius-md)] bg-[var(--color-bg)] text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="请输入联系人姓名"
          />
          {formErrors.contact_name && (
            <p className="text-xs text-[var(--color-error)] mt-1">{formErrors.contact_name}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-primary)] mb-1">
            手机号 <span className="text-[var(--color-error)]">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={11}
            value={formData.contact_phone}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '')
              handleFormChange('contact_phone', v)
            }}
            className="w-full px-3 py-2 text-sm border border-[var(--color-border-light)] rounded-[var(--radius-md)] bg-[var(--color-bg)] text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="请输入11位手机号"
          />
          {formErrors.contact_phone && (
            <p className="text-xs text-[var(--color-error)] mt-1">{formErrors.contact_phone}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-primary)] mb-1">邮箱</label>
          <input
            type="email"
            value={formData.contact_email}
            onChange={(e) => handleFormChange('contact_email', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[var(--color-border-light)] rounded-[var(--radius-md)] bg-[var(--color-bg)] text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="选填"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-[var(--color-primary)] mb-1">备注</label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => handleFormChange('notes', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[var(--color-border-light)] rounded-[var(--radius-md)] bg-[var(--color-bg)] text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
            placeholder="选填"
          />
        </div>
      </div>

      {/* Submit Error */}
      {submitError && <p className="text-xs text-[var(--color-error)]">{submitError}</p>}

      {/* Submit Button */}
      <button
        disabled={submitting}
        onClick={handleSubmit}
        className="w-full py-2.5 bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-secondary)] transition-colors duration-[var(--duration-fast)] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? '提交中...' : '提交预约'}
      </button>
    </div>
  )

  // ── Render: Step result ──────────────────────────────────────────────────

  const renderResultStep = () => (
    <div className="space-y-4 text-center">
      <CheckCircle className="w-12 h-12 text-[var(--color-success)] mx-auto" />
      <h3 className="text-sm font-semibold text-[var(--color-primary)]">预约成功</h3>

      {/* Booking ID */}
      <div>
        <p className="text-xs text-[var(--color-secondary)]">预约编号</p>
        <p className="text-2xl font-bold text-[var(--color-primary)] mt-1 font-mono">
          {result?.id ?? '--'}
        </p>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-xs text-left">
        {result?.booking_date && (
          <div>
            <span className="text-[var(--color-secondary)]">日期：</span>
            <span className="text-[var(--color-primary)]">{result.booking_date}</span>
          </div>
        )}
        {result?.booking_time && (
          <div>
            <span className="text-[var(--color-secondary)]">时段：</span>
            <span className="text-[var(--color-primary)]">{result.booking_time}</span>
          </div>
        )}
        {result?.company_name && (
          <div className="col-span-2">
            <span className="text-[var(--color-secondary)]">公司：</span>
            <span className="text-[var(--color-primary)]">{result.company_name}</span>
          </div>
        )}
        {result?.company_location && (
          <div className="col-span-2">
            <span className="text-[var(--color-secondary)]">地点：</span>
            <span className="text-[var(--color-primary)]">{result.company_location}</span>
          </div>
        )}
      </div>

      {/* Tip */}
      <p className="text-[11px] text-[var(--color-secondary)]">
        请保存预约编号，后续可通过编号和手机号查询或取消预约
      </p>
    </div>
  )

  // ── Render: Container ────────────────────────────────────────────────────

  return (
    <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-lg)] p-4">
      {onClose && (
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {step === 'date_time' && renderDateTimeStep()}
      {step === 'info' && renderInfoStep()}
      {step === 'result' && renderResultStep()}
    </div>
  )
}

export default BookingFlowCard

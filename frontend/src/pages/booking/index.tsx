import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/useToast'
import { bookingApi, type CreateBookingRequest } from '@/api/booking'
import { DatePicker } from '@/components/DatePicker'
import { TimePicker } from '@/components/TimePicker'
import type { SlotsResponse } from '@/types'

export const BookingPage = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [slotsResponse, setSlotsResponse] = useState<SlotsResponse | null>(null)
  const [formData, setFormData] = useState<Omit<CreateBookingRequest, 'booking_date' | 'booking_time'>>({
    company_name: '',
    company_location: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const loadSlots = async (date: string) => {
    try {
      setSlotsLoading(true)
      const response = await bookingApi.getSlots(date)
      setSlotsResponse(response.data)
    } catch (err) {
      console.error('Failed to load slots:', err)
      toast({ title: '获取时段失败', variant: 'error' })
    } finally {
      setSlotsLoading(false)
    }
  }

  useEffect(() => {
    loadSlots(selectedDate)
  }, [selectedDate])

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setSelectedTime('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.company_name.trim()) {
      newErrors.company_name = '请输入公司名称'
    } else if (formData.company_name.length < 2) {
      newErrors.company_name = '公司名称至少2个字符'
    } else if (formData.company_name.length > 100) {
      newErrors.company_name = '公司名称最多100个字符'
    }

    if (!formData.company_location.trim()) {
      newErrors.company_location = '请输入公司地点'
    } else if (formData.company_location.length < 2) {
      newErrors.company_location = '公司地点至少2个字符'
    } else if (formData.company_location.length > 100) {
      newErrors.company_location = '公司地点最多100个字符'
    }

    if (!formData.contact_name.trim()) {
      newErrors.contact_name = '请输入联系人'
    } else if (formData.contact_name.length < 2) {
      newErrors.contact_name = '联系人至少2个字符'
    } else if (formData.contact_name.length > 50) {
      newErrors.contact_name = '联系人最多50个字符'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.contact_email.trim()) {
      newErrors.contact_email = '请输入联系邮箱'
    } else if (!emailRegex.test(formData.contact_email)) {
      newErrors.contact_email = '请输入正确的邮箱地址'
    }

    if (!formData.contact_phone.trim()) {
      newErrors.contact_phone = '请输入联系电话'
    } else if (!/^1[3-9]\d{9}$/.test(formData.contact_phone)) {
      newErrors.contact_phone = '请输入正确的手机号码'
    }

    if (!selectedTime) {
      newErrors.booking_time = '请选择预约时段'
    }

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = '备注最多500个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      await bookingApi.createBooking({
        ...formData,
        booking_date: selectedDate,
        booking_time: selectedTime,
      })
      setSuccess(true)
      toast({ title: '预约成功', variant: 'success' })
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '预约失败，请稍后重试'
      toast({ title: errorMessage, variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSuccess(false)
    setFormData({
      company_name: '',
      company_location: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      notes: '',
    })
    setSelectedTime('')
    setErrors({})
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-4xl mx-auto px-[var(--space-md)] py-[var(--space-2xl)]">
          <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-2xl)] text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-[var(--color-primary)] mb-2">
              预约成功！
            </h1>
            <p className="text-sm text-[var(--color-secondary)] mb-8">
              我们已收到您的预约，管理员会尽快与您联系确认。
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-[var(--color-accent)] text-white rounded-[var(--radius-md)] font-medium hover:opacity-90 transition-opacity"
            >
              再预约一个
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-[var(--space-md)] py-[var(--space-2xl)]">
        <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-xl)] md:p-[var(--space-2xl)]">
          <h1 className="text-2xl font-semibold text-[var(--color-primary)] mb-2">
            预约面试
          </h1>
          <p className="text-sm text-[var(--color-secondary)] mb-8">
            请填写以下信息并选择合适的时段
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                  公司名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all ${
                    errors.company_name ? 'border-red-500' : 'border-[var(--color-border-light)]'
                  }`}
                  placeholder="请输入公司名称"
                />
                {errors.company_name && (
                  <p className="mt-1 text-sm text-red-500">{errors.company_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="company_location" className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                  公司地点 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="company_location"
                  name="company_location"
                  value={formData.company_location}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all ${
                    errors.company_location ? 'border-red-500' : 'border-[var(--color-border-light)]'
                  }`}
                  placeholder="请输入公司地点"
                />
                {errors.company_location && (
                  <p className="mt-1 text-sm text-red-500">{errors.company_location}</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contact_name" className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                    联系人 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="contact_name"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all ${
                      errors.contact_name ? 'border-red-500' : 'border-[var(--color-border-light)]'
                    }`}
                    placeholder="请输入联系人"
                  />
                  {errors.contact_name && (
                    <p className="mt-1 text-sm text-red-500">{errors.contact_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact_phone" className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                    联系电话 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all ${
                      errors.contact_phone ? 'border-red-500' : 'border-[var(--color-border-light)]'
                    }`}
                    placeholder="请输入联系电话"
                  />
                  {errors.contact_phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.contact_phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="contact_email" className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                  联系邮箱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="contact_email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all ${
                    errors.contact_email ? 'border-red-500' : 'border-[var(--color-border-light)]'
                  }`}
                  placeholder="请输入联系邮箱"
                />
                {errors.contact_email && (
                  <p className="mt-1 text-sm text-red-500">{errors.contact_email}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                选择日期 <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                minDate={getMinDate()}
                placeholder="请选择预约日期"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                选择时段 <span className="text-red-500">*</span>
              </label>
              <TimePicker
                value={selectedTime}
                onChange={setSelectedTime}
                slots={slotsResponse?.slots}
                loading={slotsLoading}
                isAvailable={slotsResponse?.is_available}
                message={slotsResponse?.message}
                placeholder="请选择时段"
              />
              {errors.booking_time && (
                <p className="mt-2 text-sm text-red-500">{errors.booking_time}</p>
              )}
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                备注信息
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all resize-none ${
                  errors.notes ? 'border-red-500' : 'border-[var(--color-border-light)]'
                }`}
                placeholder="请输入备注信息（可选）"
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-500">{errors.notes}</p>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-[var(--color-accent)] text-white rounded-[var(--radius-md)] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    提交中...
                  </>
                ) : (
                  '提交预约'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default BookingPage

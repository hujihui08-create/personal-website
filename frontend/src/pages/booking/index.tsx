import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useToast } from '@/hooks/useToast'
import { bookingApi, type CreateBookingRequest } from '@/api/booking'
import type { Booking } from '@/types'
import { DatePicker } from '@/components/DatePicker'
import { TimePicker } from '@/components/TimePicker'
import { BookingSuccessModal } from '@/components/BookingSuccessModal'
import type { SlotsResponse } from '@/types'

export const BookingPage = () => {
  const { toast: legacyToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [slotsResponse, setSlotsResponse] = useState<SlotsResponse | null>(null)
  const [formData, setFormData] = useState<
    Omit<CreateBookingRequest, 'booking_date' | 'booking_time'>
  >({
    company_name: '',
    company_location: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  // Tab switching
  const [activeTab, setActiveTab] = useState<'create' | 'lookup'>('create')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successBookingId, setSuccessBookingId] = useState<number | null>(null)

  // Lookup state
  const [lookupMode, setLookupMode] = useState<'id' | 'contact_name' | 'company_name'>('id')
  const [lookupId, setLookupId] = useState('')
  const [lookupPhone, setLookupPhone] = useState('')
  const [lookupContactName, setLookupContactName] = useState('')
  const [lookupCompanyName, setLookupCompanyName] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [lookupResult, setLookupResult] = useState<Booking | null>(null)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)

  // Cancel state
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)

  const loadSlots = async (date: string) => {
    try {
      setSlotsLoading(true)
      const response = await bookingApi.getSlots(date)
      setSlotsResponse(response.data)
    } catch (err) {
      console.error('Failed to load slots:', err)
      legacyToast({ title: '获取时段失败', variant: 'error' })
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
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
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
    if (
      formData.contact_email &&
      formData.contact_email.trim() &&
      !emailRegex.test(formData.contact_email)
    ) {
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

      if (isEditing && lookupResult) {
        // Update existing booking
        await bookingApi.updateBookingByUser(lookupResult.id, lookupPhone.trim(), {
          ...formData,
          booking_date: selectedDate,
          booking_time: selectedTime,
        })
        setIsEditing(false)
        toast.success('预约修改成功')
        // Re-fetch the updated booking
        const updated = await bookingApi.lookupBooking({
          phone: lookupPhone.trim(),
          id: lookupResult.id,
        })
        setLookupResult(updated.data)
        setActiveTab('lookup')
      } else {
        // Create new booking
        const response = await bookingApi.createBooking({
          ...formData,
          booking_date: selectedDate,
          booking_time: selectedTime,
        })
        const booking = response.data
        setSuccessBookingId(booking.id)
        setShowSuccessModal(true)
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '预约失败，请稍后重试'
      toast.error(errorMessage)
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

  const handleModalClose = () => {
    setShowSuccessModal(false)
    setSuccess(true)
  }

  // --- Lookup functions ---

  const handleLookup = async () => {
    if (!lookupPhone.trim()) {
      setLookupError('请输入手机号')
      return
    }

    if (lookupMode === 'id' && !lookupId.trim()) {
      setLookupError('请输入预约ID')
      return
    }
    if (lookupMode === 'contact_name' && !lookupContactName.trim()) {
      setLookupError('请输入联系人姓名')
      return
    }
    if (lookupMode === 'company_name' && !lookupCompanyName.trim()) {
      setLookupError('请输入公司名称')
      return
    }

    try {
      setLookupLoading(true)
      setLookupError('')

      const params: { phone: string; id?: number; contact_name?: string; company_name?: string } = {
        phone: lookupPhone.trim(),
      }

      if (lookupMode === 'id') {
        const id = parseInt(lookupId)
        if (isNaN(id) || id <= 0) {
          setLookupError('请输入有效的预约ID')
          setLookupLoading(false)
          return
        }
        params.id = id
      } else if (lookupMode === 'contact_name') {
        params.contact_name = lookupContactName.trim()
      } else if (lookupMode === 'company_name') {
        params.company_name = lookupCompanyName.trim()
      }

      const response = await bookingApi.lookupBooking(params)
      setLookupResult(response.data)
    } catch (err: any) {
      if (err.response?.status === 404) {
        setLookupError('未找到匹配的预约，请检查所填信息')
      } else {
        setLookupError(err.response?.data?.message || '查询失败')
      }
      setLookupResult(null)
    } finally {
      setLookupLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!lookupResult) return

    try {
      setCancelLoading(true)
      const response = await bookingApi.cancelBookingByUser(
        lookupResult.id,
        lookupPhone.trim(),
        cancelReason.trim() || undefined
      )
      setLookupResult(response.data)
      setShowCancelDialog(false)
      setCancelReason('')
      toast.success('预约已取消')
    } catch (err: any) {
      toast.error(err.response?.data?.message || '取消失败')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleStartCancel = () => {
    setCancelReason('')
    setShowCancelDialog(true)
  }

  // --- Edit functions ---

  const handleStartEdit = () => {
    if (!lookupResult) return
    setFormData({
      company_name: lookupResult.company_name,
      company_location: lookupResult.company_location,
      contact_name: lookupResult.contact_name,
      contact_email: lookupResult.contact_email,
      contact_phone: lookupResult.contact_phone,
      notes: lookupResult.notes || '',
    })
    setSelectedDate(lookupResult.booking_date)
    setSelectedTime(lookupResult.booking_time)
    setIsEditing(true)
    setActiveTab('create')
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    handleReset()
    setActiveTab('lookup')
    setLookupResult(null)
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // --- Render helpers ---

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: {
        label: '待确认',
        className: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
      },
      confirmed: {
        label: '已确认',
        className: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
      },
      cancelled: {
        label: '已取消',
        className: 'bg-[var(--color-bg-secondary)] text-[var(--color-secondary)]',
      },
      completed: {
        label: '已完成',
        className: 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
      },
      rejected: {
        label: '已拒绝',
        className: 'bg-[var(--color-error-soft)] text-[var(--color-error)]',
      },
    }
    const item = statusMap[status] || {
      label: status,
      className: 'bg-[var(--color-bg-secondary)] text-[var(--color-secondary)]',
    }
    return (
      <span
        className={`px-3 py-1 rounded-[var(--radius-full)] text-xs font-medium ${item.className}`}
      >
        {item.label}
      </span>
    )
  }

  // --- Render success view ---
  if (success) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-6xl mx-auto px-[var(--space-md)] py-[var(--space-2xl)]">
          <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-2xl)] text-center">
            <div className="w-16 h-16 bg-[var(--color-success-soft)] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-[var(--color-success)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-[var(--color-primary)] mb-2">预约成功！</h1>
            <p className="text-sm text-[var(--color-secondary)] mb-8">
              我们已收到您的预约，管理员会尽快与您联系确认。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-[var(--radius-sm)] font-medium hover:opacity-90 transition-opacity"
              >
                再预约一个
              </button>
              <button
                onClick={() => {
                  setSuccess(false)
                  setActiveTab('lookup')
                }}
                className="px-6 py-3 border border-[var(--color-border-light)] text-[var(--color-primary)] rounded-[var(--radius-sm)] font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                查询预约
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // --- Main render ---
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-6xl mx-auto px-[var(--space-md)] py-[var(--space-2xl)]">
        <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-xl)] md:p-[var(--space-2xl)]">
          {/* Tab bar */}
          <div className="flex gap-2 mb-8 border-b border-[var(--color-border-light)]">
            <button
              onClick={() => {
                setActiveTab('create')
                if (isEditing) handleCancelEdit()
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'create'
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-transparent text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
              }`}
            >
              {isEditing ? '修改预约' : '提交预约'}
            </button>
            <button
              onClick={() => {
                setActiveTab('lookup')
                setIsEditing(false)
                setLookupResult(null)
                setLookupError('')
                setLookupId('')
                setLookupPhone('')
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'lookup'
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-transparent text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
              }`}
            >
              查询/取消预约
            </button>
          </div>

          {/* Create / Edit Tab */}
          {activeTab === 'create' && (
            <>
              <h1 className="text-2xl font-semibold text-[var(--color-primary)] mb-2">
                {isEditing ? '修改预约' : '预约面试'}
              </h1>
              <p className="text-sm text-[var(--color-secondary)] mb-8">
                {isEditing ? '修改您的预约信息' : '请填写以下信息并选择合适的时段'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="company_name"
                      className="block text-sm font-medium text-[var(--color-primary)] mb-2"
                    >
                      公司名称 <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                      type="text"
                      id="company_name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all ${
                        errors.company_name
                          ? 'border-[var(--color-error)]'
                          : 'border-[var(--color-border-medium)]'
                      }`}
                      placeholder="请输入公司名称"
                    />
                    {errors.company_name && (
                      <p className="mt-1 text-sm text-[var(--color-error)]">
                        {errors.company_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="company_location"
                      className="block text-sm font-medium text-[var(--color-primary)] mb-2"
                    >
                      公司地点 <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                      type="text"
                      id="company_location"
                      name="company_location"
                      value={formData.company_location}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all ${
                        errors.company_location
                          ? 'border-[var(--color-error)]'
                          : 'border-[var(--color-border-medium)]'
                      }`}
                      placeholder="请输入公司地点"
                    />
                    {errors.company_location && (
                      <p className="mt-1 text-sm text-[var(--color-error)]">
                        {errors.company_location}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="contact_name"
                        className="block text-sm font-medium text-[var(--color-primary)] mb-2"
                      >
                        联系人 <span className="text-[var(--color-error)]">*</span>
                      </label>
                      <input
                        type="text"
                        id="contact_name"
                        name="contact_name"
                        value={formData.contact_name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all ${
                          errors.contact_name
                            ? 'border-[var(--color-error)]'
                            : 'border-[var(--color-border-medium)]'
                        }`}
                        placeholder="请输入联系人"
                      />
                      {errors.contact_name && (
                        <p className="mt-1 text-sm text-[var(--color-error)]">
                          {errors.contact_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="contact_phone"
                        className="block text-sm font-medium text-[var(--color-primary)] mb-2"
                      >
                        联系电话 <span className="text-[var(--color-error)]">*</span>
                      </label>
                      <input
                        type="tel"
                        id="contact_phone"
                        name="contact_phone"
                        value={formData.contact_phone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all ${
                          errors.contact_phone
                            ? 'border-[var(--color-error)]'
                            : 'border-[var(--color-border-medium)]'
                        }`}
                        placeholder="请输入联系电话"
                      />
                      {errors.contact_phone && (
                        <p className="mt-1 text-sm text-[var(--color-error)]">
                          {errors.contact_phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact_email"
                      className="block text-sm font-medium text-[var(--color-primary)] mb-2"
                    >
                      联系邮箱
                    </label>
                    <input
                      type="email"
                      id="contact_email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all ${
                        errors.contact_email
                          ? 'border-[var(--color-error)]'
                          : 'border-[var(--color-border-medium)]'
                      }`}
                      placeholder="请输入联系邮箱"
                    />
                    {errors.contact_email && (
                      <p className="mt-1 text-sm text-[var(--color-error)]">
                        {errors.contact_email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                    选择日期 <span className="text-[var(--color-error)]">*</span>
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
                    选择时段 <span className="text-[var(--color-error)]">*</span>
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
                    <p className="mt-2 text-sm text-[var(--color-error)]">{errors.booking_time}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-[var(--color-primary)] mb-2"
                  >
                    备注信息
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all resize-none ${
                      errors.notes
                        ? 'border-[var(--color-error)]'
                        : 'border-[var(--color-border-medium)]'
                    }`}
                    placeholder="请输入备注信息（可选）"
                  />
                  {errors.notes && (
                    <p className="mt-1 text-sm text-[var(--color-error)]">{errors.notes}</p>
                  )}
                </div>

                <div className={`${isEditing ? 'flex gap-3' : ''} pt-4`}>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`${isEditing ? 'flex-1' : 'w-full'} px-6 py-3 bg-[var(--color-primary)] text-white rounded-[var(--radius-sm)] font-medium hover:opacity-90 transition-opacity disabled:bg-[var(--color-border-light)] disabled:text-[#999] disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        提交中...
                      </>
                    ) : isEditing ? (
                      '保存修改'
                    ) : (
                      '提交预约'
                    )}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 px-6 py-3 border border-[var(--color-border-light)] text-[var(--color-primary)] rounded-[var(--radius-sm)] font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
                    >
                      取消修改
                    </button>
                  )}
                </div>
              </form>
            </>
          )}

          {/* Lookup Tab */}
          {activeTab === 'lookup' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-4">查询预约</h2>
              <p className="text-sm text-[var(--color-secondary)] mb-6">
                选择查询方式并输入手机号即可查看您的预约信息
              </p>

              {/* Query mode selector */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setLookupMode('id')
                    setLookupError('')
                    setLookupResult(null)
                  }}
                  className={`px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
                    lookupMode === 'id'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-bg)] text-[var(--color-primary)] border border-[var(--color-border-light)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  按预约ID
                </button>
                <button
                  onClick={() => {
                    setLookupMode('contact_name')
                    setLookupError('')
                    setLookupResult(null)
                  }}
                  className={`px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
                    lookupMode === 'contact_name'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-bg)] text-[var(--color-primary)] border border-[var(--color-border-light)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  按联系人
                </button>
                <button
                  onClick={() => {
                    setLookupMode('company_name')
                    setLookupError('')
                    setLookupResult(null)
                  }}
                  className={`px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
                    lookupMode === 'company_name'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-bg)] text-[var(--color-primary)] border border-[var(--color-border-light)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  按公司名称
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lookupMode === 'id' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                      预约ID <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                      type="text"
                      value={lookupId}
                      onChange={(e) => {
                        setLookupId(e.target.value)
                        setLookupError('')
                      }}
                      className="w-full px-4 py-3 border border-[var(--color-border-medium)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
                      placeholder="请输入预约ID"
                    />
                  </div>
                )}
                {lookupMode === 'contact_name' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                      联系人姓名 <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                      type="text"
                      value={lookupContactName}
                      onChange={(e) => {
                        setLookupContactName(e.target.value)
                        setLookupError('')
                      }}
                      className="w-full px-4 py-3 border border-[var(--color-border-medium)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
                      placeholder="请输入联系人姓名"
                    />
                  </div>
                )}
                {lookupMode === 'company_name' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                      公司名称 <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                      type="text"
                      value={lookupCompanyName}
                      onChange={(e) => {
                        setLookupCompanyName(e.target.value)
                        setLookupError('')
                      }}
                      className="w-full px-4 py-3 border border-[var(--color-border-medium)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
                      placeholder="请输入公司名称"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                    联系人手机号 <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <input
                    type="tel"
                    value={lookupPhone}
                    onChange={(e) => {
                      setLookupPhone(e.target.value)
                      setLookupError('')
                    }}
                    className="w-full px-4 py-3 border border-[var(--color-border-medium)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
                    placeholder="请输入预约时的手机号"
                  />
                </div>
              </div>

              {lookupError && <p className="text-sm text-[var(--color-error)]">{lookupError}</p>}

              <button
                onClick={handleLookup}
                disabled={lookupLoading}
                className="w-full px-6 py-3 bg-[var(--color-primary)] text-white rounded-[var(--radius-sm)] font-medium hover:opacity-90 transition-opacity disabled:bg-[var(--color-border-light)] disabled:text-[#999] disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {lookupLoading ? '查询中...' : '查询预约'}
              </button>

              {/* Lookup Result Card */}
              {lookupResult && (
                <div className="mt-6 bg-white border border-[var(--color-border-light)] rounded-[var(--radius-lg)] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[var(--color-primary)]">预约详情</h3>
                    {getStatusBadge(lookupResult.status)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[var(--color-secondary)]">预约ID：</span>
                      <span className="text-[var(--color-primary)] font-mono">
                        {lookupResult.id}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-secondary)]">预约日期：</span>
                      <span className="text-[var(--color-primary)]">
                        {lookupResult.booking_date}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-secondary)]">预约时段：</span>
                      <span className="text-[var(--color-primary)]">
                        {lookupResult.booking_time}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-secondary)]">公司名称：</span>
                      <span className="text-[var(--color-primary)]">
                        {lookupResult.company_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-secondary)]">公司地点：</span>
                      <span className="text-[var(--color-primary)]">
                        {lookupResult.company_location}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-secondary)]">联系人：</span>
                      <span className="text-[var(--color-primary)]">
                        {lookupResult.contact_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-secondary)]">邮箱：</span>
                      <span className="text-[var(--color-primary)]">
                        {lookupResult.contact_email}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-secondary)]">手机号：</span>
                      <span className="text-[var(--color-primary)]">
                        {lookupResult.contact_phone}
                      </span>
                    </div>
                    {lookupResult.notes && (
                      <div className="sm:col-span-2">
                        <span className="text-[var(--color-secondary)]">备注：</span>
                        <span className="text-[var(--color-primary)]">{lookupResult.notes}</span>
                      </div>
                    )}
                    {lookupResult.reject_reason && (
                      <div className="sm:col-span-2">
                        <span className="text-[var(--color-secondary)]">拒绝原因：</span>
                        <span className="text-[var(--color-error)]">
                          {lookupResult.reject_reason}
                        </span>
                      </div>
                    )}
                    {lookupResult.cancel_reason && (
                      <div className="sm:col-span-2">
                        <span className="text-[var(--color-secondary)]">取消原因：</span>
                        <span className="text-[var(--color-secondary)]">
                          {lookupResult.cancel_reason}
                        </span>
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <span className="text-[var(--color-secondary)]">提交时间：</span>
                      <span className="text-[var(--color-primary)]">
                        {new Date(lookupResult.created_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons - only for pending/confirmed */}
                  {(lookupResult.status === 'pending' || lookupResult.status === 'confirmed') && (
                    <div className="flex gap-3 pt-4 border-t border-[var(--color-border-light)]">
                      <button
                        onClick={handleStartEdit}
                        className="flex-1 px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-sm)] text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        修改预约
                      </button>
                      <button
                        onClick={handleStartCancel}
                        className="flex-1 px-4 py-2 bg-[var(--color-error)] text-white rounded-[var(--radius-sm)] text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        取消预约
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Cancel Booking Dialog */}
      {showCancelDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowCancelDialog(false)}
        >
          <div
            className="bg-white rounded-[var(--radius-xl)] p-6 w-[90%] max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-2">取消预约</h3>
            <p className="text-sm text-[var(--color-secondary)] mb-4">
              确定要取消此预约吗？取消后无法恢复。
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                取消原因 <span className="text-[var(--color-error)]">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-[var(--color-border-medium)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all resize-none text-sm"
                placeholder="请填写取消原因"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 px-4 py-2 border border-[var(--color-border-light)] text-[var(--color-primary)] rounded-[var(--radius-sm)] text-sm font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                再想想
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelLoading}
                className="flex-1 px-4 py-2 bg-[var(--color-error)] text-white rounded-[var(--radius-sm)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {cancelLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    处理中...
                  </>
                ) : (
                  '确认取消'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Success Modal */}
      {showSuccessModal && successBookingId !== null && (
        <BookingSuccessModal bookingId={successBookingId} onClose={handleModalClose} />
      )}
    </div>
  )
}

export default BookingPage

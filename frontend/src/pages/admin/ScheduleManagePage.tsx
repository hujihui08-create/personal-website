import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/useToast'
import { AdminLayout } from '@/components/AdminLayout'
import { bookingApi } from '@/api'
import type { ScheduleSetting } from '@/types'

const weekdayNames = ['周一', '周二', '周三', '周四', '周五']
const defaultTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']

export const ScheduleManagePage = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [schedule, setSchedule] = useState<Record<number, string[]>>({
    1: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    2: ['09:00', '10:00', '14:00', '15:00', '16:00'],
    3: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    4: ['09:00', '10:00', '14:00', '15:00'],
    5: ['09:00', '10:00', '14:00', '15:00', '16:00'],
  })

  const loadSchedule = async () => {
    try {
      setLoading(true)
      const response = await bookingApi.getScheduleSettings()
      if (response.data && response.data.length > 0) {
        const newSchedule: Record<number, string[]> = {
          1: [],
          2: [],
          3: [],
          4: [],
          5: [],
        }
        response.data.forEach((setting) => {
          if (setting.is_active && newSchedule[setting.weekday]) {
            newSchedule[setting.weekday].push(setting.start_time)
          }
        })
        setSchedule(newSchedule)
      }
    } catch (err) {
      console.error('Failed to load schedule:', err)
      toast({ title: '获取时段设置失败', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSchedule()
  }, [])

  const toggleTime = (weekday: number, time: string) => {
    setSchedule((prev) => {
      const current = prev[weekday] || []
      if (current.includes(time)) {
        return {
          ...prev,
          [weekday]: current.filter((t) => t !== time),
        }
      } else {
        return {
          ...prev,
          [weekday]: [...current, time].sort(),
        }
      }
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const settings: Omit<ScheduleSetting, 'id' | 'created_at' | 'updated_at'>[] = []
      Object.entries(schedule).forEach(([weekdayStr, times]) => {
        const weekday = parseInt(weekdayStr)
        times.forEach((time) => {
          settings.push({
            weekday,
            start_time: time,
            end_time: time,
            is_active: true,
          })
        })
      })
      await bookingApi.updateScheduleSettings({ slots: settings })
      toast({ title: '保存成功', variant: 'success' })
    } catch (err) {
      console.error('Failed to save schedule:', err)
      toast({ title: '保存失败', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSchedule({
      1: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      2: ['09:00', '10:00', '14:00', '15:00', '16:00'],
      3: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      4: ['09:00', '10:00', '14:00', '15:00'],
      5: ['09:00', '10:00', '14:00', '15:00', '16:00'],
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border-light)] pb-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-primary)]">时段设置</h1>
            <p className="text-sm text-[var(--color-secondary)]">设置每周可预约的时间段</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-[var(--color-border-light)] rounded-[var(--radius-md)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              重置默认
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg)] rounded-[var(--radius-md)] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--color-bg)]"></div>
                  保存中...
                </>
              ) : (
                '保存设置'
              )}
            </button>
          </div>
        </div>

        <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(schedule).map(([weekdayStr, times]) => {
                const weekday = parseInt(weekdayStr)
                return (
                  <div
                    key={weekday}
                    className="border-b border-[var(--color-border-light)] pb-6 last:border-b-0 last:pb-0"
                  >
                    <h3 className="text-lg font-medium text-[var(--color-primary)] mb-4">
                      {weekdayNames[weekday - 1]}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {defaultTimes.map((time) => {
                        const isActive = times.includes(time)
                        return (
                          <button
                            key={time}
                            onClick={() => toggleTime(weekday, time)}
                            className={`px-4 py-2 rounded-[var(--radius-md)] border font-medium transition-all ${
                              isActive
                                ? 'bg-[var(--color-accent)] text-[var(--color-bg)] border-[var(--color-accent)]'
                                : 'bg-[var(--color-bg)] text-[var(--color-secondary)] border-[var(--color-border-light)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
                            }`}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                    {times.length === 0 && (
                      <p className="text-sm text-[var(--color-secondary)] mt-3">该日无可预约时段</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-6">
          <h3 className="text-sm font-medium text-[var(--color-primary)] mb-3">使用说明</h3>
          <ul className="text-sm text-[var(--color-secondary)] space-y-2">
            <li>• 点击时间段可以启用/禁用该时段</li>
            <li>• 蓝色表示该时段可用</li>
            <li>• 修改后请点击"保存设置"按钮</li>
            <li>• 周末不支持预约</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}

export default ScheduleManagePage

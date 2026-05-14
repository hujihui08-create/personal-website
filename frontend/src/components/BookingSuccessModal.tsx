import { useState } from 'react'
import { toast } from 'sonner'
import { Portal } from '@/components/Portal'
import { Copy, Check } from 'lucide-react'

interface BookingSuccessModalProps {
  bookingId: number
  onClose: () => void
}

export const BookingSuccessModal = ({ bookingId, onClose }: BookingSuccessModalProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(String(bookingId))
      setCopied(true)
      toast.success('已复制')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败，请手动复制')
    }
  }

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative bg-white rounded-[var(--radius-xl)] shadow-[var(--shadow-card-strong)] p-[var(--space-2xl)] mx-[var(--space-md)] max-w-md w-full animate-in zoom-in-95"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 成功图标 */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[var(--color-success-soft)] rounded-full flex items-center justify-center">
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
          </div>

          {/* 标题 */}
          <h2 className="text-xl font-semibold text-[var(--color-primary)] text-center mb-2">
            预约成功，待确认
          </h2>

          {/* 预约ID展示区域 */}
          <div className="mt-6 p-4 bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-lg)]">
            <p className="text-sm text-[var(--color-secondary)] text-center mb-2">您的预约编号</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold font-mono text-[var(--color-accent)] tracking-wider">
                {bookingId}
              </span>
              <button
                onClick={handleCopyId}
                className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] transition-colors"
                aria-label="复制预约ID"
                title="复制预约ID"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-[var(--color-success)]" />
                ) : (
                  <Copy className="w-5 h-5 text-[var(--color-secondary)]" />
                )}
              </button>
            </div>
          </div>

          {/* 引导提示 */}
          <p className="mt-4 text-sm text-[var(--color-secondary)] text-center leading-relaxed">
            请保存此 ID，后续可通过 ID + 手机号、联系人 + 手机号或公司名 +
            手机号在预约页面查询或取消预约
          </p>

          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="mt-6 w-full px-6 py-3 bg-[var(--color-primary)] text-white rounded-[var(--radius-sm)] font-medium hover:opacity-90 transition-opacity"
          >
            知道了
          </button>
        </div>
      </div>
    </Portal>
  )
}

export default BookingSuccessModal

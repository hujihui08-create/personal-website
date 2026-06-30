import { Target } from 'lucide-react'
import type { IntentClassification } from '@/types'

interface IntentResultProps {
  intentClassification: IntentClassification | null
}

const INTENT_LABELS: Record<string, string> = {
  resume: '简历',
  booking: '预约',
  project: '项目经历',
  general: '通用问答',
}

const INTENT_COLORS: Record<string, string> = {
  resume: 'bg-[var(--color-accent)]',
  booking: 'bg-[var(--color-success)]',
  project: 'bg-[var(--color-warning)]',
  general: 'bg-[var(--color-info)]',
}

const METHOD_LABELS: Record<string, string> = {
  keyword: '关键词匹配',
  forced: '强制指定',
}

export const IntentResult = ({ intentClassification }: IntentResultProps) => {
  if (!intentClassification) {
    return <div className="text-sm text-[var(--color-secondary)] py-2">暂无意图识别数据</div>
  }

  const { agent_type, confidence, method } = intentClassification
  const isForced = method === 'forced'

  return (
    <div className="space-y-3">
      {/* Detected intent with badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-secondary)]">检测意图</span>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-full)] text-xs font-medium text-[var(--color-bg)] ${
              INTENT_COLORS[agent_type] || 'bg-[var(--color-secondary)]'
            }`}
          >
            <Target className="w-3 h-3" />
            {INTENT_LABELS[agent_type] || agent_type}
          </span>
          {isForced && (
            <span className="text-[10px] text-[var(--color-warning)] bg-[var(--color-warning)]/10 px-1.5 py-0.5 rounded">
              强制指定
            </span>
          )}
        </div>
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[var(--color-secondary)]">置信度</span>
          <span className="text-xs font-medium text-[var(--color-primary)]">
            {(confidence * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-2 bg-[var(--color-bg-secondary)] rounded-[var(--radius-full)] overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent)] rounded-[var(--radius-full)] transition-all duration-[var(--duration-slow)]"
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Classification method */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-secondary)]">分类方式</span>
        <span className="text-xs font-medium text-[var(--color-primary)]">
          {METHOD_LABELS[method] || method}
        </span>
      </div>
    </div>
  )
}

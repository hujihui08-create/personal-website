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
  resume: 'bg-[#0066FF]',
  booking: 'bg-[#10B981]',
  project: 'bg-[#F59E0B]',
  general: 'bg-[#8B5CF6]',
}

const METHOD_LABELS: Record<string, string> = {
  keyword: '关键词匹配',
  forced: '强制指定',
}

export const IntentResult = ({ intentClassification }: IntentResultProps) => {
  if (!intentClassification) {
    return <div className="text-sm text-[#666666] py-2">暂无意图识别数据</div>
  }

  const { agent_type, confidence, method } = intentClassification
  const isForced = method === 'forced'

  return (
    <div className="space-y-3">
      {/* Detected intent with badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#666666]">检测意图</span>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-full)] text-xs font-medium text-white ${
              INTENT_COLORS[agent_type] || 'bg-[#666666]'
            }`}
          >
            <Target className="w-3 h-3" />
            {INTENT_LABELS[agent_type] || agent_type}
          </span>
          {isForced && (
            <span className="text-[10px] text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 rounded">
              强制指定
            </span>
          )}
        </div>
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#666666]">置信度</span>
          <span className="text-xs font-medium text-[#1A1A1A]">
            {(confidence * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-2 bg-[#F5F5F5] rounded-[var(--radius-full)] overflow-hidden">
          <div
            className="h-full bg-[#0066FF] rounded-[var(--radius-full)] transition-all duration-[var(--duration-slow)]"
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Classification method */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#666666]">分类方式</span>
        <span className="text-xs font-medium text-[#1A1A1A]">
          {METHOD_LABELS[method] || method}
        </span>
      </div>
    </div>
  )
}

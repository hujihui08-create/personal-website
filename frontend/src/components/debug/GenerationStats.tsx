import { Zap, Hash, Layers, Timer } from 'lucide-react'
import type { GenerationStats as GenerationStatsType } from '@/types'

interface GenerationStatsProps {
  generation: GenerationStatsType | null
}

const formatResponseTime = (ms: number): string => {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  return `${ms.toFixed(0)}ms`
}

const statCards: {
  key: keyof GenerationStatsType
  label: string
  icon: typeof Zap
  format?: (val: number) => string
}[] = [
  { key: 'model', label: '模型', icon: Zap, format: (v: unknown) => String(v) },
  { key: 'prompt_tokens', label: 'Prompt Tokens', icon: Hash },
  { key: 'completion_tokens', label: 'Completion Tokens', icon: Layers },
  { key: 'total_tokens', label: 'Total Tokens', icon: Hash },
  {
    key: 'response_time_ms',
    label: '响应时间',
    icon: Timer,
    format: (v: number) => formatResponseTime(v),
  },
]

export const GenerationStats = ({ generation }: GenerationStatsProps) => {
  if (!generation) {
    return <div className="text-sm text-[#666666] py-2">暂无生成统计</div>
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {statCards.map(({ key, label, icon: Icon, format }) => {
        const value = generation[key]
        if (value === undefined || value === null) return null

        const displayValue =
          key === 'model' ? String(value) : format ? format(value as number) : String(value)

        return (
          <div key={key} className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-2.5">
            <div className="flex items-center gap-1 mb-1">
              <Icon className="w-3 h-3 text-[#0066FF]" />
              <span className="text-[10px] text-[#666666] font-medium">{label}</span>
            </div>
            <p className="text-sm font-semibold text-[#1A1A1A]">{displayValue}</p>
          </div>
        )
      })}
    </div>
  )
}

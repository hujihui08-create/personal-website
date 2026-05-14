import { useState } from 'react'
import { ChevronDown, ChevronRight, Info, Search, BarChart3, FileCode } from 'lucide-react'
import { useDebugStore } from '@/stores/debugStore'
import { IntentResult } from './IntentResult'
import { RetrievalDetail } from './RetrievalDetail'
import { GenerationStats } from './GenerationStats'
import { PromptViewer } from './PromptViewer'

interface SectionProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  defaultOpen?: boolean
  children: React.ReactNode
}

const CollapsibleSection = ({ title, icon: Icon, defaultOpen = true, children }: SectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-[#FAFAFA] transition-colors"
      >
        <Icon className="w-4 h-4 text-[#0066FF]" />
        <span className="text-sm font-semibold text-[#1A1A1A] flex-1 text-left">{title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-[#666666]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[#666666]" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  )
}

export const DebugInfoPanel = () => {
  const { debugInfo, showRetrieval, showPrompt } = useDebugStore()

  if (!debugInfo) {
    return (
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Info className="w-10 h-10 text-[#D4D4D4] mb-3" />
          <p className="text-sm text-[#666666]">发送消息后查看调试信息</p>
          <p className="text-xs text-[#999999] mt-1">意图识别、RAG检索、生成统计</p>
        </div>
      </div>
    )
  }

  const { intent_classification, retrieval, generation } = debugInfo

  return (
    <div className="space-y-3">
      {/* Intent Classification */}
      <CollapsibleSection title="意图识别" icon={Info} defaultOpen={true}>
        <IntentResult intentClassification={intent_classification} />
      </CollapsibleSection>

      {/* RAG Retrieval - only shown when showRetrieval is true */}
      {showRetrieval && (
        <CollapsibleSection title="RAG检索" icon={Search} defaultOpen={true}>
          <RetrievalDetail retrieval={retrieval} />
        </CollapsibleSection>
      )}

      {/* Generation Stats */}
      <CollapsibleSection title="生成统计" icon={BarChart3} defaultOpen={true}>
        <GenerationStats generation={generation} />
      </CollapsibleSection>

      {/* Prompt Template - only shown when showPrompt is true */}
      {showPrompt && (
        <CollapsibleSection title="Prompt模板" icon={FileCode} defaultOpen={false}>
          <PromptViewer promptTemplate={generation?.prompt_template} />
        </CollapsibleSection>
      )}
    </div>
  )
}

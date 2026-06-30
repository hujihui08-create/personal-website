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
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-[var(--color-bg-tertiary)] transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] cursor-pointer"
      >
        <Icon className="w-4 h-4 text-[var(--color-accent)]" />
        <span className="text-sm font-semibold text-[var(--color-primary)] flex-1 text-left">
          {title}
        </span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-[var(--color-secondary)]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--color-secondary)]" />
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
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-light)] bg-[var(--color-bg)] p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Info className="w-10 h-10 text-[var(--color-border-medium)] mb-3" />
          <p className="text-sm text-[var(--color-secondary)]">发送消息后查看调试信息</p>
          <p className="text-xs text-[var(--color-secondary)] mt-1">意图识别、RAG检索、生成统计</p>
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

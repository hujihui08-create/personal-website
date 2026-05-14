import { Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { RetrievalInfo } from '@/types'

interface RetrievalDetailProps {
  retrieval: RetrievalInfo | null
}

export const RetrievalDetail = ({ retrieval }: RetrievalDetailProps) => {
  const [expandedDocs, setExpandedDocs] = useState<Set<number>>(new Set())

  if (!retrieval) {
    return <div className="text-sm text-[#666666] py-2">暂无检索数据</div>
  }

  const { query, embedding_time_ms, retrieval_time_ms, document_count, documents } = retrieval

  const toggleDoc = (idx: number) => {
    setExpandedDocs((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }

  return (
    <div className="space-y-3">
      {/* Query text */}
      <div className="text-xs text-[#666666]">
        检索 Query: <span className="font-medium text-[#1A1A1A]">{query}</span>
      </div>

      {/* Timing info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#666666]" />
          <span className="text-xs text-[#666666]">嵌入耗时</span>
          <span className="text-xs font-medium text-[#1A1A1A]">{embedding_time_ms}ms</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#666666]" />
          <span className="text-xs text-[#666666]">检索耗时</span>
          <span className="text-xs font-medium text-[#1A1A1A]">{retrieval_time_ms}ms</span>
        </div>
      </div>

      {/* Document count */}
      <div className="text-xs text-[#666666]">
        文档数: <span className="font-medium text-[#1A1A1A]">{document_count}</span>
      </div>

      {/* Documents */}
      {documents && documents.length > 0 ? (
        <div className="space-y-2">
          <span className="text-xs font-medium text-[#666666]">检索文档 ({documents.length})</span>
          {documents.map((doc, idx) => {
            const isExpanded = expandedDocs.has(idx)
            // Show first line as excerpt for collapsed view
            const firstLineBreak = doc.indexOf('\n')
            const excerpt = firstLineBreak > -1 ? doc.slice(0, firstLineBreak) : doc.slice(0, 120)

            return (
              <div
                key={idx}
                className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] overflow-hidden"
              >
                <button
                  onClick={() => toggleDoc(idx)}
                  className="w-full flex items-start gap-2 p-2.5 text-left hover:bg-[#F5F5F5] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#1A1A1A] leading-relaxed line-clamp-2">
                      {excerpt}
                      {(firstLineBreak > -1 || doc.length > 120) && '...'}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#666666] flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#666666] flex-shrink-0 mt-0.5" />
                  )}
                </button>
                {/* Expanded full content */}
                {isExpanded && (
                  <div className="px-2.5 pb-2.5">
                    <div className="bg-white rounded border border-[#E5E5E5] p-2.5">
                      <p className="text-xs text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">
                        {doc}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-xs text-[#999999] py-1">无检索文档</div>
      )}
    </div>
  )
}

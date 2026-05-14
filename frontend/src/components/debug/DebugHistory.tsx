import { useEffect, useState } from 'react'
import { Trash2, Clock, MessageSquare, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { useDebugStore } from '@/stores/debugStore'
import { toast } from 'sonner'

const INTENT_LABELS: Record<string, string> = {
  profile: '个人介绍',
  project: '项目经历',
  tech: '技术栈',
  general: '通用问答',
  '': '自动识别',
}

const INTENT_COLORS: Record<string, string> = {
  profile: 'bg-[#0066FF]/10 text-[#0066FF]',
  project: 'bg-[#10B981]/10 text-[#10B981]',
  tech: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  general: 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
  '': 'bg-[#666666]/10 text-[#666666]',
}

const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  if (diffHour < 24) return `${diffHour}小时前`
  if (diffDay < 7) return `${diffDay}天前`
  return date.toLocaleDateString('zh-CN')
}

const PAGE_SIZE = 20

export const DebugHistory = () => {
  const { history, historyTotal, loadHistory, clearHistory, deleteHistoryItem } = useDebugStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)

  const totalPages = Math.ceil(historyTotal / PAGE_SIZE)

  useEffect(() => {
    loadHistory(1).then(() => setIsLoaded(true))
  }, [])

  const handlePageChange = async (page: number) => {
    setCurrentPage(page)
    await loadHistory(page)
  }

  const handleClearAll = async () => {
    try {
      await clearHistory()
      setCurrentPage(1)
      toast.success('历史记录已清空')
    } catch {
      toast.error('清空失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteHistoryItem(id)
      toast.success('已删除')
    } catch {
      toast.error('删除失败')
    }
  }

  if (!isLoaded) {
    return (
      <div className="rounded-xl border border-[#E5E5E5] p-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-[#F5F5F5] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#FAFAFA] rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-[#E5E5E5] p-6">
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Inbox className="w-8 h-8 text-[#D4D4D4] mb-2" />
          <p className="text-sm text-[#666666]">暂无调试记录</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#666666]" />
          <span className="text-sm font-semibold text-[#1A1A1A]">调试历史</span>
          <span className="text-xs text-[#999999]">({historyTotal})</span>
        </div>
        <button
          onClick={handleClearAll}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/5 rounded-md transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          清空全部
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-[#E5E5E5]">
        {history.map((item) => (
          <div key={item.id} className="px-4 py-3 hover:bg-[#FAFAFA] transition-colors group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Query */}
                <p className="text-sm font-medium text-[#1A1A1A] truncate mb-1">{item.query}</p>
                {/* Answer preview */}
                <p className="text-xs text-[#666666] line-clamp-2 mb-2">{item.answer}</p>
                {/* Meta */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      INTENT_COLORS[item.agent_type] || INTENT_COLORS['']
                    }`}
                  >
                    {INTENT_LABELS[item.agent_type] || item.agent_type || '自动识别'}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-[#999999]">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(item.created_at)}
                  </div>
                </div>
              </div>
              {/* Delete button */}
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1 rounded-md text-[#999999] hover:text-[#EF4444] hover:bg-[#EF4444]/5 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                aria-label="删除记录"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E5E5]">
          <span className="text-xs text-[#666666]">
            {currentPage} / {totalPages} 页
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 rounded-md text-[#666666] hover:bg-[#F5F5F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="上一页"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1 rounded-md text-[#666666] hover:bg-[#F5F5F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="下一页"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

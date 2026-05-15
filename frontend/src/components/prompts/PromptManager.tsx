import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePromptStore } from '@/stores/promptStore'
import { PromptList } from '@/components/prompts/PromptList'
import { PromptEditor } from '@/components/prompts/PromptEditor'

const AGENT_TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'profile', label: '个人资料' },
  { value: 'project', label: '项目知识' },
  { value: 'tech', label: '技术能力' },
  { value: 'general', label: '通用' },
  { value: 'booking', label: '预约引导' },
  { value: 'chat', label: '默认对话' },
]

export const PromptManager = () => {
  const loadPrompts = usePromptStore((s) => s.loadPrompts)

  const [agentTypeFilter, setAgentTypeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  useEffect(() => {
    loadPrompts(agentTypeFilter || undefined)
  }, [agentTypeFilter, loadPrompts])

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Prompt 管理</h1>
          <p className="text-[#666666] mt-1">管理和定制AI Agent的Prompt模板</p>
        </div>
        <button
          onClick={() => setIsEditorOpen(true)}
          className="inline-flex items-center gap-2 h-11 px-6 bg-[#1A1A1A] text-white rounded-md text-sm font-semibold hover:bg-[#333333] hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          <span>新建 Prompt</span>
        </button>
      </motion.div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[#666666]">
        <Link to="/admin/dashboard" className="hover:text-[#0066FF] transition-colors">
          仪表盘
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#1A1A1A] font-medium">Prompt 管理</span>
      </nav>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Agent type dropdown */}
        <div className="relative">
          <select
            value={agentTypeFilter}
            onChange={(e) => setAgentTypeFilter(e.target.value)}
            className="appearance-none h-10 pl-3 pr-9 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-colors cursor-pointer"
          >
            {AGENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] rotate-90 pointer-events-none" />
        </div>

        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索Prompt名称或内容..."
            className="w-full h-10 pl-9 pr-3 border border-[#D4D4D4] rounded-md text-sm text-[#1A1A1A] placeholder-[#999999] bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]/10 focus:border-[#0066FF] transition-colors"
          />
        </div>
      </motion.div>

      {/* Prompt List */}
      <PromptList searchQuery={searchQuery} />

      {/* PromptEditor Modal */}
      {isEditorOpen && <PromptEditor onClose={() => setIsEditorOpen(false)} />}
    </div>
  )
}

export default PromptManager

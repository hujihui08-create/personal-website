import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Star, Edit, Trash2, Play, Loader2, Plus, X, FileText, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Portal } from '@/components/Portal'
import { usePromptStore } from '@/stores/promptStore'
import { testWithPrompt } from '@/api/prompts'
import { PromptEditor } from '@/components/prompts/PromptEditor'
import type { PromptTemplate } from '@/types'

interface PromptListProps {
  searchQuery?: string
}

const AGENT_TYPE_LABELS: Record<string, string> = {
  profile: '个人资料',
  project: '项目知识',
  tech: '技术能力',
  general: '通用',
}

export const PromptList = ({ searchQuery = '' }: PromptListProps) => {
  const storePrompts = usePromptStore((s) => s.prompts)
  const isLoading = usePromptStore((s) => s.isLoading)
  const setDefault = usePromptStore((s) => s.setDefault)
  const removePrompt = usePromptStore((s) => s.removePrompt)

  const prompts = useMemo(() => {
    if (!searchQuery.trim()) return storePrompts
    const query = searchQuery.toLowerCase()
    return storePrompts.filter(
      (p) => p.name.toLowerCase().includes(query) || p.system_prompt.toLowerCase().includes(query)
    )
  }, [storePrompts, searchQuery])

  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | undefined>(undefined)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PromptTemplate | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Test modal state
  const [testTarget, setTestTarget] = useState<PromptTemplate | null>(null)
  const [testMessage, setTestMessage] = useState('')
  const [testResult, setTestResult] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  const handleEdit = (prompt: PromptTemplate) => {
    setEditingPrompt(prompt)
    setIsEditorOpen(true)
  }

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
    setEditingPrompt(undefined)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await removePrompt(deleteTarget.id)
      toast.success('Prompt删除成功')
      setDeleteTarget(null)
    } catch {
      toast.error('Prompt删除失败')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSetDefault = async (prompt: PromptTemplate) => {
    try {
      await setDefault(prompt.id)
      toast.success(`已将"${prompt.name}"设为默认Prompt`)
    } catch {
      toast.error('设置默认Prompt失败')
    }
  }

  const handleOpenTest = (prompt: PromptTemplate) => {
    setTestTarget(prompt)
    setTestMessage('')
    setTestResult('')
  }

  const handleRunTest = async () => {
    if (!testTarget || !testMessage.trim()) return
    setIsTesting(true)
    setTestResult('')
    try {
      const result = await testWithPrompt(testTarget.id, {
        message: testMessage.trim(),
        show_retrieval: false,
        show_prompt: false,
      })
      setTestResult(result.answer)
    } catch {
      toast.error('测试请求失败')
    } finally {
      setIsTesting(false)
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#E5E5E5] rounded-xl p-4 animate-pulse">
              <div className="h-5 w-36 bg-[#F5F5F5] rounded mb-3" />
              <div className="h-4 w-64 bg-[#F5F5F5] rounded mb-2" />
              <div className="h-4 w-48 bg-[#F5F5F5] rounded" />
            </div>
          ))}
        </div>
      )
    }

    if (prompts.length === 0 && searchQuery.trim() && storePrompts.length > 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center py-16 text-center bg-white border border-[#E5E5E5] rounded-xl"
        >
          <Search className="w-10 h-10 text-[#999999] mb-4" />
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">未找到匹配的Prompt</h2>
          <p className="text-sm text-[#666666]">请尝试其他关键词</p>
        </motion.div>
      )
    }

    if (prompts.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center py-16 text-center bg-white border border-[#E5E5E5] rounded-xl"
        >
          <div className="w-20 h-20 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-[#999999]" />
          </div>
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">暂无Prompt模板</h2>
          <p className="text-sm text-[#666666] mb-6 max-w-sm">
            创建您的第一个Prompt模板来定制Agent行为
          </p>
          <button
            onClick={() => {
              setEditingPrompt(undefined)
              setIsEditorOpen(true)
            }}
            className="inline-flex items-center gap-2 h-10 px-4 bg-[#1A1A1A] text-white rounded-md text-sm font-medium hover:bg-[#333333] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>创建Prompt</span>
          </button>
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-3"
      >
        {prompts.map((prompt, index) => (
          <motion.div
            key={prompt.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group bg-white border border-[#E5E5E5] rounded-xl p-4 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-[#0066FF]/20 transition-all cursor-pointer"
            onClick={() => handleEdit(prompt)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {prompt.is_default && (
                  <div className="flex-shrink-0 mt-0.5">
                    <Star className="w-5 h-5 text-[#F59E0B] fill-[#F59E0B]" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold text-[#1A1A1A] truncate">{prompt.name}</h3>
                    {prompt.is_default && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#FEF3C7] text-[#92400E] flex-shrink-0">
                        默认
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#F5F5F5] text-[#666666]">
                      {AGENT_TYPE_LABELS[prompt.agent_type] || prompt.agent_type}
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs text-[#666666]">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          prompt.is_active ? 'bg-[#10B981]' : 'bg-[#D4D4D4]'
                        }`}
                      />
                      {prompt.is_active ? '启用' : '停用'}
                    </span>

                    <span className="text-xs text-[#999999]">
                      {new Date(prompt.updated_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEdit(prompt)
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-[#666666] hover:text-[#1A1A1A] hover:bg-[#F5F5F5] transition-colors"
                  aria-label={`编辑 ${prompt.name}`}
                  title="编辑"
                >
                  <Edit className="w-4 h-4" />
                </button>

                {!prompt.is_default && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSetDefault(prompt)
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-md text-[#666666] hover:text-[#F59E0B] hover:bg-[#F5F5F5] transition-colors"
                    aria-label={`设为默认 ${prompt.name}`}
                    title="设为默认"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenTest(prompt)
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-[#666666] hover:text-[#0066FF] hover:bg-[#F5F5F5] transition-colors"
                  aria-label={`测试 ${prompt.name}`}
                  title="测试"
                >
                  <Play className="w-4 h-4" />
                </button>

                {!prompt.is_default && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget(prompt)
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-md text-[#666666] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                    aria-label={`删除 ${prompt.name}`}
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    )
  }

  return (
    <>
      {renderContent()}

      {/* PromptEditor Modal */}
      {isEditorOpen && <PromptEditor prompt={editingPrompt} onClose={handleCloseEditor} />}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Portal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="delete-confirm"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-sm bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-[#EF4444]/10 flex items-center justify-center mb-4">
                  <Trash2 className="w-7 h-7 text-[#EF4444]" />
                </div>
                <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">确认删除</h2>
                <p className="text-sm text-[#666666] mb-6">
                  确定要删除 <strong>{deleteTarget.name}</strong> 吗？此操作不可撤销。
                </p>
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 h-10 border border-[#D4D4D4] text-[#1A1A1A] rounded-md text-sm font-medium hover:bg-[#F5F5F5] transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 h-10 bg-[#EF4444] text-white rounded-md text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>{isDeleting ? '删除中...' : '删除'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </Portal>
      )}

      {/* Test Modal */}
      {testTarget && (
        <Portal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto"
            onClick={() => setTestTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-lg bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] my-8 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E5E5E5]">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1A1A]">测试 Prompt</h2>
                  <p className="text-sm text-[#666666] mt-0.5">{testTarget.name}</p>
                </div>
                <button
                  onClick={() => setTestTarget(null)}
                  className="w-9 h-9 flex items-center justify-center rounded-md text-[#666666] hover:text-[#1A1A1A] hover:bg-[#F5F5F5] transition-colors"
                  aria-label="关闭"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                    测试问题
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="输入测试问题，查看Agent如何回答..."
                    rows={3}
                    className="w-full border border-[#D4D4D4] rounded-md px-3 py-2 text-sm text-[#1A1A1A] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/10 focus:border-[#0066FF] transition-colors resize-y"
                  />
                </div>

                <button
                  onClick={handleRunTest}
                  disabled={isTesting || !testMessage.trim()}
                  className="inline-flex items-center gap-2 h-9 px-4 bg-[#0066FF] text-white rounded-md text-sm font-medium hover:bg-[#0066FF]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>{isTesting ? '测试中...' : '运行测试'}</span>
                </button>

                {testResult && (
                  <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-4">
                    <p className="text-xs font-medium text-[#666666] mb-2">Agent 回答</p>
                    <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap leading-relaxed">
                      {testResult}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </Portal>
      )}
    </>
  )
}

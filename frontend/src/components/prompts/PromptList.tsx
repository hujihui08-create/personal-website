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
            <div
              key={i}
              className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-4 animate-pulse"
            >
              <div className="h-5 w-36 bg-[var(--color-bg-secondary)] rounded mb-3" />
              <div className="h-4 w-64 bg-[var(--color-bg-secondary)] rounded mb-2" />
              <div className="h-4 w-48 bg-[var(--color-bg-secondary)] rounded" />
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
          className="flex flex-col items-center justify-center py-16 text-center bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)]"
        >
          <Search className="w-10 h-10 text-[var(--color-secondary)] mb-4" />
          <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-2">
            未找到匹配的Prompt
          </h2>
          <p className="text-sm text-[var(--color-secondary)]">请尝试其他关键词</p>
        </motion.div>
      )
    }

    if (prompts.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center py-16 text-center bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)]"
        >
          <div className="w-20 h-20 rounded-[var(--radius-full)] bg-[var(--color-bg-secondary)] flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-[var(--color-secondary)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-2">暂无Prompt模板</h2>
          <p className="text-sm text-[var(--color-secondary)] mb-6 max-w-sm">
            创建您的第一个Prompt模板来定制Agent行为
          </p>
          <button
            onClick={() => {
              setEditingPrompt(undefined)
              setIsEditorOpen(true)
            }}
            className="inline-flex items-center gap-2 h-10 px-4 bg-[var(--color-primary)] text-[var(--color-bg)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-primary)]/80 active:bg-[var(--color-primary)]/70 transition-all duration-[var(--duration-fast)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
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
            className="group bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-4 hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-accent)]/20 transition-all duration-[var(--duration-base)] cursor-pointer"
            onClick={() => handleEdit(prompt)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {prompt.is_default && (
                  <div className="flex-shrink-0 mt-0.5">
                    <Star className="w-5 h-5 text-[var(--color-warning)] fill-[var(--color-warning)]" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold text-[var(--color-primary)] truncate">
                      {prompt.name}
                    </h3>
                    {prompt.is_default && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-full)] text-xs bg-[var(--color-warning)]/10 text-[var(--color-warning)] flex-shrink-0">
                        默认
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-full)] text-xs bg-[var(--color-bg-secondary)] text-[var(--color-secondary)]">
                      {AGENT_TYPE_LABELS[prompt.agent_type] || prompt.agent_type}
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-secondary)]">
                      <span
                        className={`inline-block w-2 h-2 rounded-[var(--radius-full)] ${
                          prompt.is_active
                            ? 'bg-[var(--color-success)]'
                            : 'bg-[var(--color-border-medium)]'
                        }`}
                      />
                      {prompt.is_active ? '启用' : '停用'}
                    </span>

                    <span className="text-xs text-[var(--color-secondary)]">
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
                  className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors duration-[var(--duration-fast)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
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
                    className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)] hover:text-[var(--color-warning)] hover:bg-[var(--color-bg-secondary)] transition-colors duration-[var(--duration-fast)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
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
                  className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)] transition-colors duration-[var(--duration-fast)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
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
                    className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-soft)] transition-colors duration-[var(--duration-fast)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
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
              className="w-full max-w-sm bg-[var(--color-bg)] rounded-[var(--radius-xl)] shadow-[var(--shadow-card-strong)] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-[var(--radius-full)] bg-[var(--color-error-soft)] flex items-center justify-center mb-4">
                  <Trash2 className="w-7 h-7 text-[var(--color-error)]" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-1">确认删除</h2>
                <p className="text-sm text-[var(--color-secondary)] mb-6">
                  确定要删除 <strong>{deleteTarget.name}</strong> 吗？此操作不可撤销。
                </p>
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 h-10 border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-bg-tertiary)] transition-colors duration-[var(--duration-fast)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 h-10 bg-[var(--color-error)] text-[var(--color-bg)] rounded-[var(--radius-md)] text-sm font-medium hover:opacity-90 active:opacity-80 transition-all duration-[var(--duration-fast)] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-error)]/30"
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
              className="w-full max-w-lg bg-[var(--color-bg)] rounded-[var(--radius-xl)] shadow-[var(--shadow-card-strong)] my-8 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--color-border-light)]">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-primary)]">测试 Prompt</h2>
                  <p className="text-sm text-[var(--color-secondary)] mt-0.5">{testTarget.name}</p>
                </div>
                <button
                  onClick={() => setTestTarget(null)}
                  className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors duration-[var(--duration-fast)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
                  aria-label="关闭"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-primary)] mb-1.5">
                    测试问题
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="输入测试问题，查看Agent如何回答..."
                    rows={3}
                    className="w-full border border-[var(--color-border-medium)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10 focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-focus-ring)] transition-colors duration-[var(--duration-fast)] resize-y"
                  />
                </div>

                <button
                  onClick={handleRunTest}
                  disabled={isTesting || !testMessage.trim()}
                  className="inline-flex items-center gap-2 h-9 px-4 bg-[var(--color-accent)] text-[var(--color-bg)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-accent)]/90 active:bg-[var(--color-accent)]/80 transition-all duration-[var(--duration-fast)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>{isTesting ? '测试中...' : '运行测试'}</span>
                </button>

                {testResult && (
                  <div className="rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-tertiary)] p-4">
                    <p className="text-xs font-medium text-[var(--color-secondary)] mb-2">
                      Agent 回答
                    </p>
                    <p className="text-sm text-[var(--color-primary)] whitespace-pre-wrap leading-relaxed">
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

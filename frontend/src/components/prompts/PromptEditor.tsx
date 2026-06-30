import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Portal } from '@/components/Portal'
import { usePromptStore } from '@/stores/promptStore'
import type { PromptTemplate } from '@/types'

interface PromptEditorProps {
  prompt?: PromptTemplate
  onClose: () => void
}

const AGENT_TYPE_OPTIONS = [
  { value: 'profile', label: '个人资料' },
  { value: 'project', label: '项目知识' },
  { value: 'tech', label: '技术能力' },
  { value: 'general', label: '通用' },
  { value: 'booking', label: '预约引导' },
  { value: 'chat', label: '默认对话' },
]

const AVAILABLE_VARIABLES = [
  '{{profile}}',
  '{{projects}}',
  '{{tech_stack}}',
  '{{context}}',
  '{{question}}',
]

export const PromptEditor = ({ prompt, onClose }: PromptEditorProps) => {
  const isEdit = !!prompt
  const addPrompt = usePromptStore((s) => s.addPrompt)
  const editPrompt = usePromptStore((s) => s.editPrompt)

  const [name, setName] = useState('')
  const [agentType, setAgentType] = useState('general')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [contextTemplate, setContextTemplate] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; systemPrompt?: string }>({})

  useEffect(() => {
    if (prompt) {
      setName(prompt.name)
      setAgentType(prompt.agent_type)
      setSystemPrompt(prompt.system_prompt)
      setContextTemplate(prompt.context_template || '')
      setIsActive(prompt.is_active)
    }
  }, [prompt])

  const validate = (): boolean => {
    const errs: { name?: string; systemPrompt?: string } = {}
    if (!name.trim()) errs.name = '请输入Prompt名称'
    if (!systemPrompt.trim()) errs.systemPrompt = '请输入System Prompt'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setIsSubmitting(true)

    try {
      if (isEdit && prompt) {
        const result = await editPrompt(prompt.id, {
          name: name.trim(),
          system_prompt: systemPrompt.trim(),
          context_template: contextTemplate.trim() || undefined,
          is_active: isActive,
        })
        if (result) {
          toast.success('Prompt更新成功')
          onClose()
        } else {
          toast.error('Prompt更新失败')
        }
      } else {
        const result = await addPrompt({
          agent_type: agentType,
          name: name.trim(),
          system_prompt: systemPrompt.trim(),
          context_template: contextTemplate.trim() || undefined,
        })
        if (result) {
          toast.success('Prompt创建成功')
          onClose()
        } else {
          toast.error('Prompt创建失败')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          key="prompt-editor"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-lg bg-[var(--color-bg)] rounded-[var(--radius-xl)] shadow-[var(--shadow-card-strong)] my-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--color-border-light)]">
              <h2 className="text-lg font-semibold text-[var(--color-primary)]">
                {isEdit ? '编辑 Prompt' : '新建 Prompt'}
              </h2>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors duration-[var(--duration-fast)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
                aria-label="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Warning for default prompts */}
              {isEdit && prompt?.is_default && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30">
                  <AlertTriangle className="w-5 h-5 text-[var(--color-warning)] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--color-warning)] font-medium">
                    修改默认Prompt将立即影响线上Agent回答，请谨慎操作
                  </p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-primary)] mb-1.5">
                  Prompt 名称 <span className="text-[var(--color-error)]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  placeholder="例如：专业开发者评估"
                  className={`w-full border rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10 focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-focus-ring)] transition-colors duration-[var(--duration-fast)] ${
                    errors.name
                      ? 'border-[var(--color-error)]'
                      : 'border-[var(--color-border-medium)]'
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-[var(--color-error)] mt-1">{errors.name}</p>
                )}
              </div>

              {/* Agent Type */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-primary)] mb-1.5">
                  Agent 类型 <span className="text-[var(--color-error)]">*</span>
                </label>
                <select
                  value={agentType}
                  onChange={(e) => setAgentType(e.target.value)}
                  disabled={isEdit && prompt?.is_default}
                  className={`w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-colors appearance-none cursor-pointer ${
                    isEdit && prompt?.is_default
                      ? 'border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] text-[var(--color-secondary)] cursor-not-allowed'
                      : ''
                  }`}
                >
                  {AGENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* System Prompt */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-primary)] mb-1.5">
                  System Prompt <span className="text-[var(--color-error)]">*</span>
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => {
                    setSystemPrompt(e.target.value)
                    if (errors.systemPrompt)
                      setErrors((prev) => ({ ...prev, systemPrompt: undefined }))
                  }}
                  placeholder="你是专业的面试评估助手..."
                  rows={8}
                  className={`w-full border rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10 focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-focus-ring)] transition-colors duration-[var(--duration-fast)] min-h-[200px] resize-y ${
                    errors.systemPrompt
                      ? 'border-[var(--color-error)]'
                      : 'border-[var(--color-border-medium)]'
                  }`}
                />
                {errors.systemPrompt && (
                  <p className="text-xs text-[var(--color-error)] mt-1">{errors.systemPrompt}</p>
                )}
              </div>

              {/* Context Template */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-primary)] mb-1.5">
                  Context Template{' '}
                  <span className="text-[var(--color-secondary)] font-normal">(可选)</span>
                </label>
                <textarea
                  value={contextTemplate}
                  onChange={(e) => setContextTemplate(e.target.value)}
                  placeholder="知识库上下文模板..."
                  rows={4}
                  className="w-full border border-[var(--color-border-medium)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10 focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-focus-ring)] transition-colors duration-[var(--duration-fast)] resize-y"
                />
              </div>

              {/* Available Variables */}
              <div className="rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-light)] p-3">
                <p className="text-xs font-medium text-[var(--color-secondary)] mb-2">
                  可用变量提示
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_VARIABLES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector(
                          'textarea'
                        ) as HTMLTextAreaElement | null
                        if (textarea) {
                          const start = textarea.selectionStart
                          const end = textarea.selectionEnd
                          const newValue =
                            systemPrompt.slice(0, start) + ` ${v} ` + systemPrompt.slice(end)
                          setSystemPrompt(newValue)
                        }
                      }}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[var(--color-bg)] border border-[var(--color-border-light)] text-[var(--color-accent)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-colors duration-[var(--duration-fast)] cursor-pointer font-mono"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Is Active */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-[var(--color-primary)]">启用状态</p>
                  <p className="text-xs text-[var(--color-secondary)] mt-0.5">
                    停用后Agent将不会使用此Prompt
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-[var(--radius-full)] transition-colors duration-[var(--duration-base)] ${
                    isActive ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-medium)]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-[var(--radius-full)] bg-[var(--color-bg)] transition-transform duration-[var(--duration-base)] ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border-light)]">
              <button
                onClick={onClose}
                className="h-10 px-4 border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-bg-tertiary)] transition-colors duration-[var(--duration-fast)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 h-10 px-4 bg-[var(--color-primary)] text-[var(--color-bg)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--color-primary)]/80 active:bg-[var(--color-primary)]/70 transition-all duration-[var(--duration-fast)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{isSubmitting ? '保存中...' : '保存'}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  )
}

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
]

const AVAILABLE_VARIABLES = ['{{profile}}', '{{projects}}', '{{tech_stack}}', '{{question}}']

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
            className="w-full max-w-lg bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] my-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E5E5E5]">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">
                {isEdit ? '编辑 Prompt' : '新建 Prompt'}
              </h2>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-md text-[#666666] hover:text-[#1A1A1A] hover:bg-[#F5F5F5] transition-colors"
                aria-label="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Warning for default prompts */}
              {isEdit && prompt?.is_default && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[#FEF3C7] border border-[#F59E0B]/30">
                  <AlertTriangle className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#92400E]">
                    修改默认Prompt将立即影响线上Agent回答，请谨慎操作
                  </p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Prompt 名称 <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  placeholder="例如：专业开发者评估"
                  className={`w-full border rounded-md px-3 py-2 text-sm text-[#1A1A1A] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/10 focus:border-[#0066FF] transition-colors ${
                    errors.name ? 'border-[#EF4444]' : 'border-[#D4D4D4]'
                  }`}
                />
                {errors.name && <p className="text-xs text-[#EF4444] mt-1">{errors.name}</p>}
              </div>

              {/* Agent Type */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Agent 类型 <span className="text-[#EF4444]">*</span>
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
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  System Prompt <span className="text-[#EF4444]">*</span>
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
                  className={`w-full border rounded-md px-3 py-2 text-sm text-[#1A1A1A] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/10 focus:border-[#0066FF] transition-colors min-h-[200px] resize-y ${
                    errors.systemPrompt ? 'border-[#EF4444]' : 'border-[#D4D4D4]'
                  }`}
                />
                {errors.systemPrompt && (
                  <p className="text-xs text-[#EF4444] mt-1">{errors.systemPrompt}</p>
                )}
              </div>

              {/* Context Template */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Context Template <span className="text-[#999999] font-normal">(可选)</span>
                </label>
                <textarea
                  value={contextTemplate}
                  onChange={(e) => setContextTemplate(e.target.value)}
                  placeholder="知识库上下文模板..."
                  rows={4}
                  className="w-full border border-[#D4D4D4] rounded-md px-3 py-2 text-sm text-[#1A1A1A] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/10 focus:border-[#0066FF] transition-colors resize-y"
                />
              </div>

              {/* Available Variables */}
              <div className="rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] p-3">
                <p className="text-xs font-medium text-[#666666] mb-2">可用变量提示</p>
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
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white border border-[#E5E5E5] text-[#0066FF] hover:border-[#0066FF] hover:bg-[#0066FF]/5 transition-colors cursor-pointer font-mono"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Is Active */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">启用状态</p>
                  <p className="text-xs text-[#666666] mt-0.5">停用后Agent将不会使用此Prompt</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    isActive ? 'bg-[#0066FF]' : 'bg-[#D4D4D4]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E5E5]">
              <button
                onClick={onClose}
                className="h-10 px-4 border border-[#D4D4D4] text-[#1A1A1A] rounded-md text-sm font-medium hover:bg-[#F5F5F5] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 h-10 px-4 bg-[#1A1A1A] text-white rounded-md text-sm font-medium hover:bg-[#333333] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

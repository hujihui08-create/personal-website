import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { useDebugStore } from '@/stores/debugStore'
import { usePromptStore } from '@/stores/promptStore'
import { toast } from 'sonner'

const AGENT_TYPE_OPTIONS = [
  { value: '', label: '自动识别' },
  { value: 'profile', label: '个人介绍' },
  { value: 'project', label: '项目经历' },
  { value: 'tech', label: '技术栈' },
  { value: 'general', label: '通用问答' },
]

export const DebugChatArea = () => {
  const {
    agentType,
    messages,
    isLoading,
    showRetrieval,
    showPrompt,
    setAgentType,
    sendMessage,
    toggleRetrieval,
    togglePrompt,
  } = useDebugStore()

  const { prompts, loadPrompts, isLoading: promptsLoading } = usePromptStore()

  const [input, setInput] = useState('')
  const [selectedPromptId, setSelectedPromptId] = useState<number | undefined>(undefined)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Load prompts when agent type changes
  useEffect(() => {
    loadPrompts(agentType || undefined)
  }, [agentType])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const threshold = 100
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    if (isNearBottom) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages, isLoading])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')
    try {
      await sendMessage(text, selectedPromptId)
    } catch {
      toast.error('发送失败')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const filteredPrompts = prompts.filter(
    (p) => !agentType || p.agent_type === agentType || p.agent_type === ''
  )

  return (
    <div className="flex flex-col h-full">
      {/* Top controls */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--color-border-light)] space-y-2 bg-[var(--color-bg)]">
        <div className="flex items-center gap-2">
          {/* Agent type select */}
          <select
            value={agentType}
            onChange={(e) => setAgentType(e.target.value)}
            className="flex-1 h-9 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-colors appearance-none cursor-pointer"
          >
            {AGENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Prompt selector */}
          <select
            value={selectedPromptId ?? ''}
            onChange={(e) =>
              setSelectedPromptId(e.target.value ? Number(e.target.value) : undefined)
            }
            disabled={promptsLoading}
            className="flex-1 h-9 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-colors appearance-none cursor-pointer disabled:border-[var(--color-border-light)] disabled:bg-[var(--color-bg-secondary)] disabled:text-[var(--color-secondary)] disabled:cursor-not-allowed"
          >
            <option value="">{promptsLoading ? '加载中...' : '默认Prompt'}</option>
            {filteredPrompts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.is_default ? '(默认)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle switches */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showRetrieval}
              onChange={toggleRetrieval}
              className="w-3.5 h-3.5 rounded border-[var(--color-border-medium)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]/20 cursor-pointer"
            />
            <span className="text-xs text-[var(--color-secondary)]">显示检索详情</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPrompt}
              onChange={togglePrompt}
              className="w-3.5 h-3.5 rounded border-[var(--color-border-medium)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]/20 cursor-pointer"
            />
            <span className="text-xs text-[var(--color-secondary)]">显示Prompt</span>
          </label>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4"
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-[var(--radius-full)] bg-[var(--color-bg-secondary)] flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-[var(--color-border-medium)]" />
            </div>
            <p className="text-sm font-medium text-[var(--color-primary)] mb-1">Agent 调试面板</p>
            <p className="text-xs text-[var(--color-secondary)]">
              发送消息测试 Agent 的意图识别与检索效果
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-[var(--radius-full)] flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-primary)]'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-3.5 h-3.5 text-[var(--color-bg)]" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-[var(--color-bg)]" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[80%] px-4 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg)] rounded-2xl rounded-br-sm'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-primary)] rounded-2xl rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-[var(--radius-full)] bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-[var(--color-bg)]" />
            </div>
            <div className="bg-[var(--color-bg-secondary)] rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 text-[var(--color-accent)] animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--color-border-light)] bg-[var(--color-bg)]">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入测试消息..."
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-medium)] rounded-[var(--radius-lg)] px-3 py-2 text-sm text-[var(--color-primary)] placeholder-[var(--color-secondary)] resize-none focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/20 transition-colors duration-[var(--duration-fast)] disabled:opacity-50 max-h-24"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-9 h-9 bg-[var(--color-accent)] text-[var(--color-bg)] rounded-[var(--radius-lg)] flex items-center justify-center hover:bg-[var(--color-accent)]/90 active:bg-[var(--color-accent)]/80 transition-colors duration-[var(--duration-fast)] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] cursor-pointer"
            aria-label="发送消息"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

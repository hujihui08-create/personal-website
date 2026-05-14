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
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#E5E5E5] space-y-2 bg-white">
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
              className="w-3.5 h-3.5 rounded border-[#D4D4D4] text-[#0066FF] focus:ring-[#0066FF]/20 cursor-pointer"
            />
            <span className="text-xs text-[#666666]">显示检索详情</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPrompt}
              onChange={togglePrompt}
              className="w-3.5 h-3.5 rounded border-[#D4D4D4] text-[#0066FF] focus:ring-[#0066FF]/20 cursor-pointer"
            />
            <span className="text-xs text-[#666666]">显示Prompt</span>
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
            <div className="w-16 h-16 rounded-[var(--radius-full)] bg-[#F5F5F5] flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-[#D4D4D4]" />
            </div>
            <p className="text-sm font-medium text-[#1A1A1A] mb-1">Agent 调试面板</p>
            <p className="text-xs text-[#666666]">发送消息测试 Agent 的意图识别与检索效果</p>
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
                msg.role === 'user' ? 'bg-[#0066FF]' : 'bg-[#1A1A1A]'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-3.5 h-3.5 text-white" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-white" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[80%] px-4 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-[#0066FF] text-white rounded-2xl rounded-br-sm'
                  : 'bg-[#F5F5F5] text-[#1A1A1A] rounded-2xl rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-[var(--radius-full)] bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-[#F5F5F5] rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 text-[#0066FF] animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-[#E5E5E5] bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入测试消息..."
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-[#FAFAFA] border border-[#D4D4D4] rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder-[#999999] resize-none focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/20 transition-colors disabled:opacity-50 max-h-24"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-9 h-9 bg-[#0066FF] text-white rounded-lg flex items-center justify-center hover:bg-[#0066FF]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="发送消息"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

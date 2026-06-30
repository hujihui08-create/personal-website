import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'

interface DebugMessage {
  role: 'user' | 'assistant'
  content: string
  trace?: string
}

export const DebugChatPanel = () => {
  const [messages, setMessages] = useState<DebugMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg: DebugMessage = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Simulate debug response (will be replaced with real API later)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '(调试模式 - Agent 调试 API 集成开发中)',
          trace: 'Intent: general | Confidence: 0.85 | Method: keyword',
        },
      ])
      setLoading(false)
    }, 800)
  }

  return (
    <div className="h-[calc(100vh-16rem)] flex flex-col">
      <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-4 flex-shrink-0">
        调试对话
      </h2>
      <p className="text-xs text-[var(--color-secondary)] mb-4 flex-shrink-0">
        在此测试 Agent 配置，查看意图分类和 Harness 执行追踪
      </p>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-accent)]'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg)] border border-[var(--color-border-light)]'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.trace && (
                <div className="mt-2 pt-2 border-t border-[var(--color-border-light)]">
                  <p className="text-xs text-[var(--color-secondary)] font-mono">{msg.trace}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-lg px-4 py-3">
              <Loader2 className="w-5 h-5 text-[var(--color-accent)] animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="输入测试消息..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-sm border border-[var(--color-border-light)] rounded-lg bg-white text-[var(--color-primary)] placeholder-[var(--color-secondary)]"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default DebugChatPanel

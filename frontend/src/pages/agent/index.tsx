import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Mic, Bot, User, Loader2, Menu } from 'lucide-react'
import { useAgentStore } from '@/stores/agent'
import { agentApi } from '@/api/agent'
import { SessionList } from '@/components/agent/SessionList'
import { BookingResultCard } from '@/components/agent/BookingResultCard'
import type { AgentChatMessage, BookingResultData } from '@/types'
import { toast } from 'sonner'

const RECOMMENDED_QUESTIONS = [
  '你的工作经验是什么？',
  '擅长哪些技术栈？',
  '可以介绍一下你的项目经历吗？',
  '如何联系你？',
  '我要预约面试',
  '我要查询预约',
  '我要取消预约',
]

const stripMarkdown = (text: string): string => {
  return text
    .replace(/\*\*/g, '')
    .replace(/create_booking|query_booking|cancel_booking/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const truncateBookingText = (text: string, hasCard: boolean): string => {
  if (!hasCard) return text
  const lines = text.split('\n')
  const firstLine = lines[0] || ''
  if (/[。！：]$/.test(firstLine.trim())) {
    return firstLine.trim()
  }
  return lines.slice(0, 2).join('\n').trim()
}

const formatMessageContent = (
  content: string,
  hasCard: boolean,
  index: number,
  messagesLength: number
): string => {
  let text = stripMarkdown(content)
  const isLastAssistant = index === messagesLength - 1
  if (hasCard && isLastAssistant) {
    text = truncateBookingText(text, hasCard)
  }
  return text
}

export const AgentPage = () => {
  const {
    visitorId,
    sessions,
    activeSessionId,
    messages,
    isLoading,
    error,
    setActiveSessionId,
    addMessage,
    updateLastMessage,
    setLoading,
    setError,
    initVisitor,
    loadSessions,
    switchSession,
    deleteSession,
    createNewSession,
  } = useAgentStore()

  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [sessionPanelOpen, setSessionPanelOpen] = useState(false)
  const [bookingCardData, setBookingCardData] = useState<BookingResultData | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const currentStreamRef = useRef<(() => void) | null>(null)
  const pendingContentRef = useRef('')
  const rafRef = useRef<number | null>(null)
  const lastContentLengthRef = useRef(0)

  const flushContent = useCallback(() => {
    if (pendingContentRef.current) {
      updateLastMessage(pendingContentRef.current)
      pendingContentRef.current = ''
    }
    rafRef.current = null
  }, [updateLastMessage])

  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    const contentLen = lastMsg?.content?.length ?? 0
    if (contentLen !== lastContentLengthRef.current) {
      lastContentLengthRef.current = contentLen
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    }
  }, [messages])

  useEffect(() => {
    initVisitor()
    loadSessions()
  }, [])

  useEffect(() => {
    initSpeechRecognition()
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (currentStreamRef.current) {
        currentStreamRef.current()
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const scrollToBottom = () => {
    const container = messagesContainerRef.current
    if (!container) return
    const threshold = 100
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    if (isNearBottom) {
      container.scrollTop = container.scrollHeight
    }
  }

  const initSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
    }

    recognition.onerror = () => {
      setIsRecording(false)
      toast.error('语音识别失败，请使用文字输入')
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
  }

  const handleVoiceToggle = () => {
    if (!recognitionRef.current) {
      toast.error('您的浏览器不支持语音输入')
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  const handleSend = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || isLoading) return

    // 如果有正在进行的连接，先关闭它
    if (currentStreamRef.current) {
      currentStreamRef.current()
      currentStreamRef.current = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    pendingContentRef.current = ''
    lastContentLengthRef.current = 0

    const userMessage: AgentChatMessage = {
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    }

    addMessage(userMessage)
    setInput('')
    setError(null)
    setLoading(true)

    const assistantMessage: AgentChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    }
    addMessage(assistantMessage)

    setBookingCardData(null)

    try {
      const request = {
        message: messageText.trim(),
        session_id: activeSessionId ?? undefined,
        visitor_id: visitorId ?? undefined,
        stream: true,
      }

      const closeStream = agentApi.chatStream(
        request,
        (chunk) => {
          if (chunk.type === 'thinking') {
            console.log('Thinking...')
          } else if (chunk.type === 'booking_result' && chunk.data) {
            flushContent()
            setBookingCardData(chunk.data)
            // Truncation is handled in render via formatMessageContent
          } else if (chunk.type === 'chunk' && chunk.content) {
            pendingContentRef.current += chunk.content
            if (!rafRef.current) {
              rafRef.current = requestAnimationFrame(flushContent)
            }
          }
        },
        (newSessionId) => {
          flushContent()
          if (!activeSessionId) {
            setActiveSessionId(newSessionId)
            loadSessions()
          }
          setLoading(false)
          currentStreamRef.current = null
        },
        (err) => {
          flushContent()
          setError(err.message)
          setLoading(false)
          currentStreamRef.current = null
          toast.error('发送失败，请重试')
        }
      )

      currentStreamRef.current = closeStream
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败')
      setLoading(false)
      currentStreamRef.current = null
      toast.error('发送失败，请重试')
    }
  }

  const handleSwitchSession = async (sessionId: string) => {
    if (sessionId === activeSessionId) return

    if (currentStreamRef.current) {
      currentStreamRef.current()
      currentStreamRef.current = null
      setLoading(false)
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    pendingContentRef.current = ''

    await switchSession(sessionId)
    setSessionPanelOpen(false)
  }

  const handleNewSession = () => {
    if (currentStreamRef.current) {
      currentStreamRef.current()
      currentStreamRef.current = null
      setLoading(false)
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    pendingContentRef.current = ''
    createNewSession()
    setSessionPanelOpen(false)
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (currentStreamRef.current) {
      currentStreamRef.current()
      currentStreamRef.current = null
      setLoading(false)
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    pendingContentRef.current = ''
    await deleteSession(sessionId)
  }

  return (
    <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-4rem)] bg-[var(--color-bg)]">
      <div className="flex h-full">
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={handleSwitchSession}
          onDelete={handleDeleteSession}
          onNew={handleNewSession}
          isOpen={sessionPanelOpen}
          onToggle={() => setSessionPanelOpen(!sessionPanelOpen)}
        />
        <main className="flex-1 flex flex-col min-w-0 h-full max-w-4xl mx-auto px-[var(--space-md)] py-[var(--space-md)] md:py-[var(--space-xl)]">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between mb-[var(--space-md)]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSessionPanelOpen(true)}
                className="md:hidden p-1.5 -ml-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-primary)] transition-colors duration-[var(--duration-fast)]"
                aria-label="打开会话列表"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-[var(--radius-full)] bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-primary)] flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[var(--color-primary)]">AI 智能助手</h1>
                <p className="text-xs text-[var(--color-secondary)]">了解我的背景和经历</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto min-h-0 mb-[var(--space-md)] space-y-[var(--space-md)] pr-2"
          >
            {messages.length === 0 && (
              <div className="text-center py-[var(--space-3xl)]">
                <div className="w-20 h-20 rounded-[var(--radius-full)] bg-[var(--color-accent-soft)] flex items-center justify-center mx-auto mb-[var(--space-lg)]">
                  <Bot className="w-10 h-10 text-[var(--color-accent)]" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-2">
                  你好！有什么可以帮到你？
                </h2>
                <p className="text-sm text-[var(--color-secondary)] mb-[var(--space-xl)]">
                  你可以问我关于我的工作经历、技术栈或项目经验
                </p>

                {/* Recommended Questions */}
                <div className="flex flex-wrap gap-3 justify-center max-w-lg mx-auto">
                  {RECOMMENDED_QUESTIONS.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSend(question)}
                      className="px-4 py-2 text-sm text-[var(--color-primary)] bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-md)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-[var(--radius-full)] flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-[var(--color-primary)]'
                      : 'bg-[var(--color-accent)]'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-[var(--radius-lg)] px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-bg)] text-[var(--color-primary)] border border-[var(--color-border-light)]'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {formatMessageContent(
                      message.content,
                      !!bookingCardData,
                      index,
                      messages.length
                    )}
                  </p>
                </div>
              </div>
            ))}

            {bookingCardData && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-[var(--radius-full)] bg-[var(--color-accent)] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="max-w-[80%]">
                  <BookingResultCard data={bookingCardData} />
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-[var(--radius-full)] bg-[var(--color-accent)] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-lg)] px-4 py-3">
                  <Loader2 className="w-5 h-5 text-[var(--color-accent)] animate-spin" />
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="bg-[var(--color-error)]/10 text-[var(--color-error)] px-4 py-2 rounded-[var(--radius-md)] text-sm">
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-2 md:p-3">
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={handleVoiceToggle}
                className={`p-1.5 md:p-2 rounded-[var(--radius-md)] transition-all ${
                  isRecording
                    ? 'bg-[var(--color-error)] text-white animate-pulse'
                    : 'text-[var(--color-secondary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                <Mic className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="在这里输入你的问题..."
                disabled={isLoading}
                className="flex-1 bg-transparent border-0 resize-none text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:ring-0 max-h-24 md:max-h-32 text-sm"
                rows={1}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="p-1.5 md:p-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AgentPage

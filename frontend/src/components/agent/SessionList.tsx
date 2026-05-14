import { Plus, Trash2, MessageSquare, X } from 'lucide-react'
import type { AgentSessionMeta } from '@/types'

interface SessionListProps {
  sessions: AgentSessionMeta[]
  activeSessionId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onNew: () => void
  isOpen: boolean
  onToggle: () => void
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export const SessionList = ({
  sessions,
  activeSessionId,
  onSelect,
  onDelete,
  onNew,
  isOpen,
  onToggle,
}: SessionListProps) => {
  const sessionListContent = (
    <>
      <div className="p-[var(--space-md)]">
        <button
          onClick={onNew}
          className="flex items-center gap-2 w-full h-10 px-[var(--space-md)] bg-[var(--color-primary)] text-[var(--color-bg)] rounded-[var(--radius-sm)] hover:opacity-90 transition-colors duration-[var(--duration-fast)]"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="text-sm">新建对话</span>
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <li className="px-[var(--space-md)] py-[var(--space-lg)] text-center">
            <p className="text-sm text-[var(--color-secondary)]">暂无对话记录</p>
          </li>
        ) : (
          sessions.map((session) => {
            const isActive = session.session_id === activeSessionId
            return (
              <li key={session.session_id}>
                <button
                  onClick={() => onSelect(session.session_id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-[var(--space-sm)] w-full text-left px-[var(--space-md)] py-[var(--space-sm)] transition-colors duration-[var(--duration-fast)] ${
                    isActive
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                      : 'text-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate text-sm">{session.title || '新对话'}</span>
                  <span className="text-xs text-[var(--color-secondary)] whitespace-nowrap">
                    {formatDate(session.updated_at)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(session.session_id)
                    }}
                    aria-label="删除会话"
                    className="p-[var(--space-xs)] rounded-[var(--radius-sm)] hover:text-[var(--color-error)] transition-colors duration-[var(--duration-fast)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </button>
              </li>
            )
          })
        )}
      </ul>
    </>
  )

  return (
    <>
      <nav className="hidden md:flex flex-col w-64 h-full bg-[var(--color-bg-tertiary)] border-r border-[var(--color-border-light)]">
        {sessionListContent}
      </nav>

      <div className="md:hidden">
        {isOpen && (
          <div
            onClick={onToggle}
            className="fixed inset-0 bg-black/20 z-[var(--z-modal)] transition-opacity duration-[var(--duration-base)]"
          />
        )}

        <div
          className={`fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-[var(--color-bg)] z-[var(--z-modal)] shadow-lg flex flex-col transition-transform duration-[var(--duration-base)] ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ transitionTimingFunction: 'var(--easing-standard)' }}
        >
          <div className="flex items-center justify-between p-[var(--space-md)] border-b border-[var(--color-border-light)] flex-shrink-0">
            <span className="text-sm font-semibold text-[var(--color-primary)]">会话列表</span>
            <button
              onClick={onToggle}
              className="p-[var(--space-xs)] rounded-[var(--radius-sm)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-secondary)] transition-colors duration-[var(--duration-fast)]"
              aria-label="关闭会话列表"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex flex-col min-h-0">{sessionListContent}</div>
        </div>
      </div>
    </>
  )
}

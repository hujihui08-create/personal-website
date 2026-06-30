import { useState } from 'react'
import { FileCode, X } from 'lucide-react'

interface PromptViewerProps {
  promptTemplate: string | undefined
}

export const PromptViewer = ({ promptTemplate }: PromptViewerProps) => {
  const [isOpen, setIsOpen] = useState(false)

  if (!promptTemplate) {
    return <div className="text-sm text-[var(--color-secondary)] py-2">暂无Prompt模板数据</div>
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors duration-[var(--duration-fast)] cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
      >
        <FileCode className="w-3.5 h-3.5" />
        查看完整Prompt
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false)
          }}
        >
          <div
            className="bg-[var(--color-bg)] rounded-[var(--radius-xl)] border border-[var(--color-border-light)] shadow-lg w-[90vw] max-w-2xl max-h-[80vh] flex flex-col m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-light)]">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[var(--color-accent)]" />
                <h3 className="text-sm font-semibold text-[var(--color-primary)]">Prompt 模板</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-secondary)] transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] cursor-pointer"
                aria-label="关闭"
              >
                <X className="w-4 h-4 text-[var(--color-secondary)]" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="bg-[var(--color-bg-secondary)] rounded-[var(--radius-lg)] p-4 font-mono text-sm text-[var(--color-primary)] whitespace-pre-wrap break-words leading-relaxed">
                {promptTemplate}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

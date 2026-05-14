import { useState } from 'react'
import { FileCode, X } from 'lucide-react'

interface PromptViewerProps {
  promptTemplate: string | undefined
}

export const PromptViewer = ({ promptTemplate }: PromptViewerProps) => {
  const [isOpen, setIsOpen] = useState(false)

  if (!promptTemplate) {
    return <div className="text-sm text-[#666666] py-2">暂无Prompt模板数据</div>
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0066FF] hover:text-[#0066FF]/80 transition-colors"
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
            className="bg-white rounded-xl border border-[#E5E5E5] shadow-lg w-[90vw] max-w-2xl max-h-[80vh] flex flex-col m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E5]">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#0066FF]" />
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Prompt 模板</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-[#F5F5F5] transition-colors"
                aria-label="关闭"
              >
                <X className="w-4 h-4 text-[#666666]" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="bg-[#F5F5F5] rounded-lg p-4 font-mono text-sm text-[#1A1A1A] whitespace-pre-wrap break-words leading-relaxed">
                {promptTemplate}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

import { useEffect, useState, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { usePromptStore } from '@/stores/promptStore'

interface PromptSelectorProps {
  agentType?: string
  value?: number
  onChange: (promptId: number | undefined) => void
}

export const PromptSelector = ({ agentType, value, onChange }: PromptSelectorProps) => {
  const prompts = usePromptStore((s) => s.prompts)
  const loadPrompts = usePromptStore((s) => s.loadPrompts)

  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPrompts(agentType || undefined)
  }, [agentType, loadPrompts])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedPrompt = prompts.find((p) => p.id === value)

  const getDisplayLabel = () => {
    if (value === undefined) return '默认Prompt'
    if (!selectedPrompt) return '默认Prompt'
    return selectedPrompt.is_default ? `${selectedPrompt.name} (默认)` : selectedPrompt.name
  }

  const handleSelect = (promptId: number | undefined) => {
    onChange(promptId)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between gap-2 w-full border border-[var(--color-border-medium)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-primary)] bg-[var(--color-bg)] hover:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10 focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-focus-ring)] transition-colors duration-[var(--duration-fast)]"
      >
        <span
          className={
            value === undefined ? 'text-[var(--color-secondary)]' : 'text-[var(--color-primary)]'
          }
        >
          {getDisplayLabel()}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--color-secondary)] transition-transform duration-[var(--duration-base)] ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-40 mt-1 w-full bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-lg shadow-[var(--shadow-card-hover)] max-h-60 overflow-y-auto">
          {/* Default option */}
          <button
            type="button"
            onClick={() => handleSelect(undefined)}
            className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors duration-[var(--duration-fast)] ${
              value === undefined
                ? 'text-[var(--color-accent)] bg-[var(--color-accent)]/5'
                : 'text-[var(--color-primary)]'
            }`}
          >
            <span>默认Prompt</span>
            {value === undefined && <Check className="w-4 h-4" />}
          </button>

          {/* Divider */}
          {prompts.length > 0 && <div className="border-t border-[var(--color-border-light)]" />}

          {/* Prompt options */}
          {prompts.map((prompt) => (
            <button
              key={prompt.id}
              type="button"
              onClick={() => handleSelect(prompt.id)}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors duration-[var(--duration-fast)] ${
                value === prompt.id
                  ? 'text-[var(--color-accent)] bg-[var(--color-accent)]/5'
                  : 'text-[var(--color-primary)]'
              }`}
            >
              <span>
                {prompt.name}
                {prompt.is_default && (
                  <span className="text-[var(--color-secondary)] ml-1">(默认)</span>
                )}
              </span>
              {value === prompt.id && <Check className="w-4 h-4 flex-shrink-0" />}
            </button>
          ))}

          {prompts.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-[var(--color-secondary)]">
              {agentType ? '该类型暂无Prompt模板' : '暂无Prompt模板'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PromptSelector

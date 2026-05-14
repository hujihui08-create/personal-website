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
        className="inline-flex items-center justify-between gap-2 w-full border border-[#D4D4D4] rounded-md px-3 py-2 text-sm text-[#1A1A1A] bg-white hover:border-[#0066FF] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/10 focus:border-[#0066FF] transition-colors"
      >
        <span className={value === undefined ? 'text-[#666666]' : 'text-[#1A1A1A]'}>
          {getDisplayLabel()}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#666666] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-[#E5E5E5] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08)] max-h-60 overflow-y-auto">
          {/* Default option */}
          <button
            type="button"
            onClick={() => handleSelect(undefined)}
            className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-[#F5F5F5] transition-colors ${
              value === undefined ? 'text-[#0066FF] bg-[#0066FF]/5' : 'text-[#1A1A1A]'
            }`}
          >
            <span>默认Prompt</span>
            {value === undefined && <Check className="w-4 h-4" />}
          </button>

          {/* Divider */}
          {prompts.length > 0 && <div className="border-t border-[#E5E5E5]" />}

          {/* Prompt options */}
          {prompts.map((prompt) => (
            <button
              key={prompt.id}
              type="button"
              onClick={() => handleSelect(prompt.id)}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-[#F5F5F5] transition-colors ${
                value === prompt.id ? 'text-[#0066FF] bg-[#0066FF]/5' : 'text-[#1A1A1A]'
              }`}
            >
              <span>
                {prompt.name}
                {prompt.is_default && <span className="text-[#999999] ml-1">(默认)</span>}
              </span>
              {value === prompt.id && <Check className="w-4 h-4 flex-shrink-0" />}
            </button>
          ))}

          {prompts.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-[#999999]">
              {agentType ? '该类型暂无Prompt模板' : '暂无Prompt模板'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PromptSelector

import { useState, useEffect } from 'react'
import { Save, Loader2 } from 'lucide-react'
import type { AgentConfigData } from '@/types'
import { agentConfigApi } from '@/api/agent-config'
import { toast } from 'sonner'

const defaultConfig: AgentConfigData = {
  llm: { temperature: 0.7, maxTokens: 2000, topK: 3 },
  harness: { maxSteps: 5, timeoutSeconds: 120, loopStrategy: 'react' },
  tools: { enabled: ['create_booking', 'query_booking', 'cancel_booking'] },
}

export const ParamConfig = () => {
  const [config, setConfig] = useState<AgentConfigData>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const res = await agentConfigApi.getCurrentConfig()
      if (res.data && (res.data as any).config) {
        setConfig((res.data as any).config)
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await agentConfigApi.saveDraft(config as any)
      toast.success('参数已保存为草稿，请前往版本管理发布')
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const updateLLM = (key: string, value: number) => {
    setConfig((prev) => ({
      ...prev,
      llm: { ...prev.llm, [key]: value },
    }))
  }

  const updateHarness = (key: string, value: number | string) => {
    setConfig((prev) => ({
      ...prev,
      harness: { ...prev.harness, [key]: value },
    }))
  }

  if (loading) {
    return <div className="text-center py-12 text-[var(--color-secondary)]">加载配置中...</div>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* LLM Section */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b border-[var(--color-border-light)]">
          LLM 参数
        </h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center justify-between text-sm text-[var(--color-secondary)] mb-1">
              <span>Temperature</span>
              <span className="font-mono text-[var(--color-accent)]">
                {config.llm.temperature.toFixed(1)}
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.llm.temperature}
              onChange={(e) => updateLLM('temperature', parseFloat(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
            <div className="flex justify-between text-xs text-[var(--color-secondary)] mt-0.5">
              <span>0 (精确)</span>
              <span>2 (随机)</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--color-secondary)] mb-1">Max Tokens</label>
            <input
              type="number"
              min="100"
              max="8000"
              step="100"
              value={config.llm.maxTokens}
              onChange={(e) => updateLLM('maxTokens', parseInt(e.target.value) || 2000)}
              className="w-full px-3 py-2 text-sm border border-[var(--color-border-light)] rounded-md bg-white text-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--color-secondary)] mb-1">
              RAG Top-K (检索文档数)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.llm.topK}
              onChange={(e) => updateLLM('topK', parseInt(e.target.value) || 3)}
              className="w-full px-3 py-2 text-sm border border-[var(--color-border-light)] rounded-md bg-white text-[var(--color-primary)]"
            />
          </div>
        </div>
      </section>

      {/* Harness Section */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--color-primary)] mb-4 pb-2 border-b border-[var(--color-border-light)]">
          Harness 执行引擎参数
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--color-secondary)] mb-1">
              Max Steps (最大工具调用步数)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={config.harness.maxSteps}
              onChange={(e) => updateHarness('maxSteps', parseInt(e.target.value) || 5)}
              className="w-full px-3 py-2 text-sm border border-[var(--color-border-light)] rounded-md bg-white text-[var(--color-primary)]"
            />
            <p className="text-xs text-[var(--color-secondary)] mt-1">
              超过此次数后 Agent 强制终止循环
            </p>
          </div>
          <div>
            <label className="block text-sm text-[var(--color-secondary)] mb-1">
              Timeout (超时秒数)
            </label>
            <input
              type="number"
              min="30"
              max="300"
              step="10"
              value={config.harness.timeoutSeconds}
              onChange={(e) => updateHarness('timeoutSeconds', parseInt(e.target.value) || 120)}
              className="w-full px-3 py-2 text-sm border border-[var(--color-border-light)] rounded-md bg-white text-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--color-secondary)] mb-1">
              Loop Strategy (循环策略)
            </label>
            <select
              value={config.harness.loopStrategy}
              onChange={(e) => updateHarness('loopStrategy', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--color-border-light)] rounded-md bg-white text-[var(--color-primary)]"
            >
              <option value="react">ReAct</option>
            </select>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="pt-4 border-t border-[var(--color-border-light)]">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          保存配置
        </button>
        <p className="text-xs text-[var(--color-secondary)] mt-2">
          💡 保存后需前往「版本管理」标签页发布才能生效
        </p>
      </div>
    </div>
  )
}

export default ParamConfig

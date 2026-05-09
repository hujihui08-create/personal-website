import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { LLMConfig, EmbeddingConfig } from '@/types'
import { configApi } from '@/api/config'

const LLMPROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'custom', label: '自定义' },
]

const EMBEDDING_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'custom', label: '自定义' },
]

export const SettingsPage = () => {
  const queryClient = useQueryClient()
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: '',
    api_key: '',
    base_url: '',
    model: '',
    temperature: 0.7,
    max_tokens: 2000,
  })
  const [embeddingConfig, setEmbeddingConfig] = useState<EmbeddingConfig>({
    provider: '',
    api_key: '',
    base_url: '',
    model: '',
  })

  const { data: llmConfigData, isLoading: llmLoading } = useQuery({
    queryKey: ['llm-config'],
    queryFn: configApi.getLLMConfig,
  })

  const { data: embeddingConfigData, isLoading: embeddingLoading } = useQuery({
    queryKey: ['embedding-config'],
    queryFn: configApi.getEmbeddingConfig,
  })

  useEffect(() => {
    if (llmConfigData?.data) {
      setLlmConfig(llmConfigData.data)
    }
  }, [llmConfigData])

  useEffect(() => {
    if (embeddingConfigData?.data) {
      setEmbeddingConfig(embeddingConfigData.data)
    }
  }, [embeddingConfigData])

  const updateLLMMutation = useMutation({
    mutationFn: configApi.updateLLMConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-config'] })
      toast.success('LLM配置更新成功')
    },
    onError: () => {
      toast.error('LLM配置更新失败')
    },
  })

  const updateEmbeddingMutation = useMutation({
    mutationFn: configApi.updateEmbeddingConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embedding-config'] })
      toast.success('Embedding配置更新成功')
    },
    onError: () => {
      toast.error('Embedding配置更新失败')
    },
  })

  const handleSaveLLM = () => {
    updateLLMMutation.mutate(llmConfig)
  }

  const handleSaveEmbedding = () => {
    updateEmbeddingMutation.mutate(embeddingConfig)
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-primary)]">
            系统设置
          </h1>
          <p className="text-[var(--color-secondary)] mt-1">
            配置AI助手的模型参数和API
          </p>
        </div>
      </motion.div>

      <div className="grid gap-8">
        {/* LLM 配置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-primary)]">
                LLM 配置
              </h2>
              <p className="text-sm text-[var(--color-secondary)] mt-1">
                配置大语言模型的API参数
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                服务提供商
              </label>
              <select
                value={llmConfig.provider}
                onChange={(e) => setLlmConfig({ ...llmConfig, provider: e.target.value })}
                className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                disabled={llmLoading}
              >
                <option value="">请选择</option>
                {LLMPROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                API Key
              </label>
              <input
                type="password"
                value={llmConfig.api_key}
                onChange={(e) => setLlmConfig({ ...llmConfig, api_key: e.target.value })}
                placeholder="请输入API Key"
                className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                disabled={llmLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                Base URL (可选)
              </label>
              <input
                type="text"
                value={llmConfig.base_url}
                onChange={(e) => setLlmConfig({ ...llmConfig, base_url: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                disabled={llmLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                模型名称
              </label>
              <input
                type="text"
                value={llmConfig.model}
                onChange={(e) => setLlmConfig({ ...llmConfig, model: e.target.value })}
                placeholder="gpt-4o"
                className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                disabled={llmLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                  温度 (Temperature)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={llmConfig.temperature}
                  onChange={(e) => setLlmConfig({ ...llmConfig, temperature: parseFloat(e.target.value) })}
                  className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                  disabled={llmLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                  最大 Token 数
                </label>
                <input
                  type="number"
                  min="100"
                  value={llmConfig.max_tokens}
                  onChange={(e) => setLlmConfig({ ...llmConfig, max_tokens: parseInt(e.target.value) })}
                  className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                  disabled={llmLoading}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSaveLLM}
                disabled={llmLoading || updateLLMMutation.isPending}
                className="inline-flex items-center gap-2 h-10 px-4 bg-[var(--color-accent)] text-[var(--color-bg)] rounded-[var(--radius-sm)] text-sm font-semibold hover:bg-[var(--color-accent)]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateLLMMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>保存 LLM 配置</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Embedding 配置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-primary)]">
                Embedding 配置
              </h2>
              <p className="text-sm text-[var(--color-secondary)] mt-1">
                配置向量嵌入模型的API参数
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                服务提供商
              </label>
              <select
                value={embeddingConfig.provider}
                onChange={(e) => setEmbeddingConfig({ ...embeddingConfig, provider: e.target.value })}
                className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                disabled={embeddingLoading}
              >
                <option value="">请选择</option>
                {EMBEDDING_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                API Key
              </label>
              <input
                type="password"
                value={embeddingConfig.api_key}
                onChange={(e) => setEmbeddingConfig({ ...embeddingConfig, api_key: e.target.value })}
                placeholder="请输入API Key"
                className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                disabled={embeddingLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                Base URL (可选)
              </label>
              <input
                type="text"
                value={embeddingConfig.base_url}
                onChange={(e) => setEmbeddingConfig({ ...embeddingConfig, base_url: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                disabled={embeddingLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-primary)] mb-2">
                模型名称
              </label>
              <input
                type="text"
                value={embeddingConfig.model}
                onChange={(e) => setEmbeddingConfig({ ...embeddingConfig, model: e.target.value })}
                placeholder="text-embedding-3-small"
                className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                disabled={embeddingLoading}
              />
            </div>

            <div className="pt-4">
              <button
                onClick={handleSaveEmbedding}
                disabled={embeddingLoading || updateEmbeddingMutation.isPending}
                className="inline-flex items-center gap-2 h-10 px-4 bg-[var(--color-accent)] text-[var(--color-bg)] rounded-[var(--radius-sm)] text-sm font-semibold hover:bg-[var(--color-accent)]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateEmbeddingMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>保存 Embedding 配置</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default SettingsPage

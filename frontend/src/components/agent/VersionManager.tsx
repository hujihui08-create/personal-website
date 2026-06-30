import { useState, useEffect } from 'react'
import { Rocket, RotateCcw, History, Loader2 } from 'lucide-react'
import type { AgentConfig, AgentConfigVersion } from '@/types'
import { agentConfigApi } from '@/api/agent-config'
import { toast } from 'sonner'

export const VersionManager = () => {
  const [currentConfig, setCurrentConfig] = useState<AgentConfig | null>(null)
  const [versions, setVersions] = useState<AgentConfigVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [rollingBack, setRollingBack] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [configRes, versionsRes] = await Promise.all([
        agentConfigApi.getCurrentConfig().catch(() => ({ data: null })),
        agentConfigApi.listVersions().catch(() => ({ data: [] })),
      ])
      setCurrentConfig(configRes.data as AgentConfig | null)
      setVersions(versionsRes.data as AgentConfigVersion[])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!confirm('确定发布当前草稿？发布后配置将立即对用户生效。')) return
    setPublishing(true)
    try {
      await agentConfigApi.publishConfig()
      toast.success('配置已发布')
      loadData()
    } catch (e: unknown) {
      const message =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(message || '发布失败，请先保存草稿')
    } finally {
      setPublishing(false)
    }
  }

  const handleRollback = async (versionId: number) => {
    if (!confirm(`确定回滚到此版本？将创建新的发布版本。`)) return
    setRollingBack(versionId)
    try {
      await agentConfigApi.rollback(versionId)
      toast.success('已回滚')
      loadData()
    } catch {
      toast.error('回滚失败')
    } finally {
      setRollingBack(null)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-[var(--color-secondary)]">加载中...</div>
  }

  const currentVersion = currentConfig?.version || '未发布'

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Current Status */}
      <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-primary)]">当前生效版本</h3>
            <p className="text-2xl font-bold text-[var(--color-accent)] mt-1">{currentVersion}</p>
            <p className="text-xs text-[var(--color-secondary)] mt-1">
              {currentConfig?.published_at
                ? `发布于 ${new Date(currentConfig.published_at).toLocaleString('zh-CN')}`
                : '尚未发布任何版本'}
            </p>
          </div>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            发布
          </button>
        </div>
      </div>

      {/* Version History */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] mb-3">
          <History className="w-4 h-4" />
          版本历史
        </h3>
        <div className="space-y-2">
          {versions.map((v) => (
            <div
              key={v.id}
              className={`flex items-center justify-between bg-[var(--color-bg)] border rounded-lg p-4 ${
                v.version === currentVersion
                  ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
                  : 'border-[var(--color-border-light)]'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--color-primary)]">
                    {v.version}
                  </span>
                  {v.version === currentVersion && (
                    <span className="px-1.5 py-0.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded">
                      当前
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--color-secondary)] mt-0.5">
                  {v.published_at
                    ? new Date(v.published_at).toLocaleString('zh-CN')
                    : v.created_at
                      ? new Date(v.created_at).toLocaleString('zh-CN')
                      : ''}
                </p>
              </div>
              {v.version !== currentVersion && (
                <button
                  onClick={() => handleRollback(v.id)}
                  disabled={rollingBack === v.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--color-border-light)] rounded-md hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-50"
                >
                  {rollingBack === v.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3 h-3" />
                  )}
                  回滚
                </button>
              )}
            </div>
          ))}
          {versions.length === 0 && (
            <div className="text-center py-8 text-[var(--color-secondary)] text-sm">
              暂无历史版本，保存配置后点击"发布"创建第一个版本
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VersionManager

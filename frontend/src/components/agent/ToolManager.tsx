import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { AgentTool } from '@/types'
import { agentConfigApi } from '@/api/agent-config'
import { toast } from 'sonner'

export const ToolManager = () => {
  const [tools, setTools] = useState<AgentTool[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTool, setExpandedTool] = useState<string | null>(null)

  useEffect(() => {
    loadTools()
  }, [])

  const loadTools = async () => {
    try {
      const res = await agentConfigApi.listTools()
      setTools(res.data)
    } catch {
      toast.error('加载工具列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (tool: AgentTool) => {
    try {
      await agentConfigApi.updateToolActive(tool.name, !tool.is_active)
      toast.success(`${tool.is_active ? '已禁用' : '已启用'}工具: ${tool.name}`)
      loadTools()
    } catch {
      toast.error('操作失败')
    }
  }

  const formatJSON = (jsonStr: string) => {
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2)
    } catch {
      return jsonStr
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-[var(--color-secondary)]">加载中...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-primary)]">工具管理</h2>
        <span className="text-xs text-[var(--color-secondary)]">共 {tools.length} 个工具</span>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
        💡 新增工具需要开发人员编写后端执行代码。如需新增工具，请联系开发团队。
      </div>

      <div className="space-y-3">
        {tools.map((tool) => {
          const isExpanded = expandedTool === tool.name
          return (
            <div
              key={tool.name}
              className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-lg overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-[var(--color-primary)]">{tool.name}</h3>
                    <span className="px-1.5 py-0.5 text-xs bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded font-mono">
                      {tool.handler_type}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-secondary)] mt-1">{tool.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(tool)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      tool.is_active
                        ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {tool.is_active ? '已启用' : '已禁用'}
                  </button>
                  <button
                    onClick={() => setExpandedTool(isExpanded ? null : tool.name)}
                    className="p-1 text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Parameters */}
              {isExpanded && (
                <div className="border-t border-[var(--color-border-light)] p-4 bg-gray-50">
                  <h4 className="text-xs font-semibold text-[var(--color-secondary)] mb-2">
                    参数定义 (JSON Schema)
                  </h4>
                  <pre className="text-xs text-[var(--color-primary)] bg-white border border-[var(--color-border-light)] rounded-md p-3 overflow-x-auto font-mono whitespace-pre">
                    {formatJSON(tool.parameters_json)}
                  </pre>
                </div>
              )}
            </div>
          )
        })}
        {tools.length === 0 && (
          <div className="text-center py-8 text-[var(--color-secondary)] text-sm">暂无工具</div>
        )}
      </div>
    </div>
  )
}

export default ToolManager

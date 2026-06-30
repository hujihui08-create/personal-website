import { useSearchParams } from 'react-router-dom'
import { GitBranch, Target, Wrench, Sliders, History, Bug, FileText } from 'lucide-react'
import { IntentManager } from '@/components/agent/IntentManager'
import { ToolManager } from '@/components/agent/ToolManager'
import { ParamConfig } from '@/components/agent/ParamConfig'
import { VersionManager } from '@/components/agent/VersionManager'
import { AgentDebugPanel } from '@/components/debug/AgentDebugPanel'
import { PromptManager } from '@/components/prompts/PromptManager'
import { AgentFlowChart } from '@/components/agent/AgentFlowChart'

const TABS = [
  { key: 'flow', label: '流程图', icon: GitBranch },
  { key: 'intents', label: '意图管理', icon: Target },
  { key: 'tools', label: '工具管理', icon: Wrench },
  { key: 'prompts', label: 'Prompt 模板', icon: FileText },
  { key: 'params', label: '参数配置', icon: Sliders },
  { key: 'versions', label: '版本', icon: History },
  { key: 'debug', label: '调试', icon: Bug },
]

const AgentConfigPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'flow'

  const setTab = (tab: string) => {
    setSearchParams({ tab })
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--color-border-light)]">
        <h1 className="text-xl font-semibold text-[var(--color-primary)]">Agent 管理</h1>
        <p className="text-sm text-[var(--color-secondary)] mt-1">
          统一管理 Agent 流程、意图、工具、Prompt 和调试
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 flex border-b border-[var(--color-border-light)] bg-[var(--color-bg)] overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-[1px] ${
                activeTab === tab.key
                  ? 'text-[var(--color-accent)] border-[var(--color-accent)]'
                  : 'text-[var(--color-secondary)] border-transparent hover:text-[var(--color-primary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'flow' && <AgentFlowChart />}
        {activeTab === 'intents' && <IntentManager />}
        {activeTab === 'tools' && <ToolManager />}
        {activeTab === 'params' && <ParamConfig />}
        {activeTab === 'versions' && <VersionManager />}
        {activeTab === 'prompts' && <PromptManager />}
        {activeTab === 'debug' && <AgentDebugPanel />}
      </div>
    </div>
  )
}

export default AgentConfigPage

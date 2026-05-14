import { DebugChatArea } from './DebugChatArea'
import { DebugInfoPanel } from './DebugInfoPanel'
import { DebugHistory } from './DebugHistory'

export const AgentDebugPanel = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      {/* Page title */}
      <div className="flex-shrink-0 mb-4">
        <h1 className="text-xl font-semibold text-[#1A1A1A]">Agent 调试</h1>
        <p className="text-sm text-[#666666] mt-1">测试 Agent 的意图识别、RAG检索和生成效果</p>
      </div>

      {/* Main content: chat + debug panel */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Left - Chat area */}
        <div className="flex-1 min-h-0 rounded-xl border border-[#E5E5E5] bg-white overflow-hidden flex flex-col">
          <DebugChatArea />
        </div>

        {/* Right - Debug info panel */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 overflow-y-auto">
          <DebugInfoPanel />
        </div>
      </div>

      {/* Bottom - History */}
      <div className="flex-shrink-0 mt-4">
        <DebugHistory />
      </div>
    </div>
  )
}

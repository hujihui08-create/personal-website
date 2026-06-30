import { useState, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { agentConfigApi } from '@/api/agent-config'

const initialNodes: Node[] = [
  {
    id: 'intent',
    position: { x: 50, y: 120 },
    data: { label: '意图识别\n(intent → Prompt)' },
    style: {
      background: '#e0f2fe',
      border: '2px solid #0284c7',
      borderRadius: 12,
      padding: '16px 24px',
      fontSize: 14,
      fontWeight: 600,
      color: '#0c4a6e',
      width: 180,
    },
  },
  {
    id: 'rag',
    position: { x: 310, y: 120 },
    data: { label: 'RAG 检索\n(topK: 3)' },
    style: {
      background: '#fef3c7',
      border: '2px solid #d97706',
      borderRadius: 12,
      padding: '16px 24px',
      fontSize: 14,
      fontWeight: 600,
      color: '#78350f',
      width: 180,
    },
  },
  {
    id: 'harness',
    position: { x: 570, y: 80 },
    data: { label: 'Harness ReAct 循环' },
    type: 'group',
    style: {
      background: '#fce7f3',
      border: '2px solid #db2777',
      borderRadius: 16,
      padding: '20px 32px',
      fontSize: 14,
      fontWeight: 700,
      color: '#831843',
      width: 300,
      height: 140,
    },
  },
  {
    id: 'llm',
    position: { x: 20, y: 45 },
    data: { label: 'LLM 推理\n(temperature: 0.7)' },
    style: {
      background: '#f0fdf4',
      border: '2px solid #16a34a',
      borderRadius: 10,
      padding: '10px 16px',
      fontSize: 12,
      fontWeight: 600,
      color: '#166534',
      width: 120,
    },
    parentId: 'harness',
    extent: 'parent',
  },
  {
    id: 'tool',
    position: { x: 160, y: 45 },
    data: { label: '工具执行\n(3 tools)' },
    style: {
      background: '#fff1f2',
      border: '2px solid #e11d48',
      borderRadius: 10,
      padding: '10px 16px',
      fontSize: 12,
      fontWeight: 600,
      color: '#9f1239',
      width: 120,
    },
    parentId: 'harness',
    extent: 'parent',
  },
  {
    id: 'output',
    position: { x: 890, y: 120 },
    data: { label: '输出\n(最终回复)' },
    style: {
      background: '#f0fdf4',
      border: '2px solid #15803d',
      borderRadius: 12,
      padding: '16px 24px',
      fontSize: 14,
      fontWeight: 600,
      color: '#14532d',
      width: 180,
    },
  },
]

const initialEdges: Edge[] = [
  {
    id: 'e1',
    source: 'intent',
    target: 'rag',
    animated: true,
    style: { stroke: '#0284c7', strokeWidth: 2 },
  },
  {
    id: 'e2',
    source: 'rag',
    target: 'harness',
    animated: true,
    style: { stroke: '#d97706', strokeWidth: 2 },
  },
  {
    id: 'e3',
    source: 'llm',
    target: 'tool',
    animated: true,
    style: { stroke: '#16a34a', strokeWidth: 2 },
    label: 'tool_call',
  },
  {
    id: 'e4',
    source: 'tool',
    target: 'llm',
    animated: true,
    style: { stroke: '#e11d48', strokeWidth: 2, strokeDasharray: '5,5' },
    label: 'result',
  },
  {
    id: 'e5',
    source: 'harness',
    target: 'output',
    animated: true,
    style: { stroke: '#15803d', strokeWidth: 2 },
  },
]

export const AgentFlowChart = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)
  const [harnessParams, setHarnessParams] = useState({ maxSteps: 5, timeoutSeconds: 120 })

  useEffect(() => {
    agentConfigApi
      .getCurrentConfig()
      .then((res) => {
        if (
          res.data &&
          (
            res.data as unknown as {
              config?: { harness?: { maxSteps: number; timeoutSeconds: number } }
            }
          ).config?.harness
        ) {
          const h = (
            res.data as unknown as {
              config: { harness: { maxSteps: number; timeoutSeconds: number } }
            }
          ).config.harness
          setHarnessParams({ maxSteps: h.maxSteps, timeoutSeconds: h.timeoutSeconds })
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-primary)]">Agent 执行流程图</h2>
        <div className="flex items-center gap-4 text-xs text-[var(--color-secondary)]">
          <span>
            Max Steps:{' '}
            <span className="font-mono text-[var(--color-accent)]">{harnessParams.maxSteps}</span>
          </span>
          <span>
            Timeout:{' '}
            <span className="font-mono text-[var(--color-accent)]">
              {harnessParams.timeoutSeconds}s
            </span>
          </span>
        </div>
      </div>
      <p className="text-xs text-[var(--color-secondary)]">
        以下为当前 Agent 的完整执行流水线。Harness 框内展示 LLM ⇄ 工具执行的 ReAct 循环。
      </p>
      <div
        style={{ width: '100%', height: 400 }}
        className="border border-[var(--color-border-light)] rounded-lg bg-white"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  )
}

export default AgentFlowChart

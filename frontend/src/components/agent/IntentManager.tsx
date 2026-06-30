import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react'
import type { AgentIntent } from '@/types'
import { agentConfigApi } from '@/api/agent-config'
import { toast } from 'sonner'

export const IntentManager = () => {
  const [intents, setIntents] = useState<AgentIntent[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formLabel, setFormLabel] = useState('')
  const [formKeywords, setFormKeywords] = useState('')
  const [formSortOrder, setFormSortOrder] = useState(0)
  const [formActive, setFormActive] = useState(true)

  useEffect(() => {
    loadIntents()
  }, [])

  const loadIntents = async () => {
    try {
      const res = await agentConfigApi.listIntents()
      setIntents(res.data)
    } catch {
      toast.error('加载意图列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('请输入意图名称')
      return
    }
    try {
      if (editingId) {
        await agentConfigApi.updateIntent(editingId, {
          name: formName,
          label: formLabel,
          keywords: formKeywords,
          sort_order: formSortOrder,
          is_active: formActive,
        })
        toast.success('意图已更新')
      } else {
        await agentConfigApi.createIntent({
          name: formName,
          label: formLabel,
          keywords: formKeywords,
          sort_order: formSortOrder,
          is_active: formActive,
        })
        toast.success('意图已创建')
      }
      resetForm()
      loadIntents()
    } catch {
      toast.error('保存失败')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此意图？')) return
    try {
      await agentConfigApi.deleteIntent(id)
      toast.success('意图已删除')
      loadIntents()
    } catch {
      toast.error('删除失败')
    }
  }

  const handleEdit = (intent: AgentIntent) => {
    setEditingId(intent.id)
    setFormName(intent.name)
    setFormLabel(intent.label)
    setFormKeywords(intent.keywords)
    setFormSortOrder(intent.sort_order)
    setFormActive(intent.is_active)
    setShowAdd(true)
  }

  const handleToggleActive = async (intent: AgentIntent) => {
    try {
      await agentConfigApi.updateIntent(intent.id, { is_active: !intent.is_active })
      loadIntents()
    } catch {
      toast.error('操作失败')
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormName('')
    setFormLabel('')
    setFormKeywords('')
    setFormSortOrder(0)
    setFormActive(true)
    setShowAdd(false)
  }

  const moveIntent = async (index: number, direction: 'up' | 'down') => {
    const newIntents = [...intents]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newIntents.length) return

    const toUpdate = [
      { id: newIntents[index].id, sort_order: newIntents[swapIndex].sort_order },
      { id: newIntents[swapIndex].id, sort_order: newIntents[index].sort_order },
    ]

    try {
      await agentConfigApi.updateIntentSort(toUpdate)
      loadIntents()
    } catch {
      toast.error('排序失败')
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-[var(--color-secondary)]">加载中...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-primary)]">意图管理</h2>
        <button
          onClick={() => {
            resetForm()
            setShowAdd(true)
          }}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--color-accent)] text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          新增意图
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--color-secondary)] mb-1">
                意图名称 (name)
              </label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="如: salary"
                className="w-full px-3 py-2 text-sm border border-[var(--color-border-light)] rounded-md bg-white text-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-secondary)] mb-1">
                显示标签 (label)
              </label>
              <input
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="如: 薪资期望"
                className="w-full px-3 py-2 text-sm border border-[var(--color-border-light)] rounded-md bg-white text-[var(--color-primary)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--color-secondary)] mb-1">
              关键词 (逗号分隔)
            </label>
            <input
              value={formKeywords}
              onChange={(e) => setFormKeywords(e.target.value)}
              placeholder="如: 薪资,待遇,salary"
              className="w-full px-3 py-2 text-sm border border-[var(--color-border-light)] rounded-md bg-white text-[var(--color-primary)]"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-[var(--color-secondary)]">
              <input
                type="checkbox"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
                className="rounded"
              />
              启用
            </label>
            <label className="text-sm text-[var(--color-secondary)]">
              优先级:
              <input
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(Number(e.target.value))}
                className="w-20 ml-2 px-2 py-1 text-sm border border-[var(--color-border-light)] rounded-md bg-white"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-accent)] text-white text-sm rounded-md"
            >
              <Save className="w-3.5 h-3.5" /> 保存
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-1 px-3 py-1.5 border border-[var(--color-border-light)] text-sm rounded-md"
            >
              <X className="w-3.5 h-3.5" /> 取消
            </button>
          </div>
        </div>
      )}

      {/* Intent List */}
      <div className="space-y-2">
        {intents.map((intent, index) => (
          <div
            key={intent.id}
            className="flex items-center gap-3 bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-lg p-3"
          >
            <div className="flex flex-col gap-1">
              <button
                onClick={() => moveIntent(index, 'up')}
                disabled={index === 0}
                className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] disabled:opacity-30"
              >
                ▲
              </button>
              <button
                onClick={() => moveIntent(index, 'down')}
                disabled={index === intents.length - 1}
                className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] disabled:opacity-30"
              >
                ▼
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--color-primary)]">
                  {intent.label || intent.name}
                </span>
                <code className="text-xs text-[var(--color-secondary)]">({intent.name})</code>
                <span className="text-xs text-[var(--color-secondary)]">
                  优先级: {intent.sort_order}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {intent.keywords
                  .split(',')
                  .filter(Boolean)
                  .map((kw) => (
                    <span
                      key={kw}
                      className="px-1.5 py-0.5 text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded"
                    >
                      {kw.trim()}
                    </span>
                  ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleActive(intent)}
                className={`px-2 py-1 text-xs rounded ${
                  intent.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {intent.is_active ? '启用' : '禁用'}
              </button>
              <button
                onClick={() => handleEdit(intent)}
                className="p-1 text-[var(--color-secondary)] hover:text-[var(--color-accent)]"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(intent.id)}
                className="p-1 text-[var(--color-secondary)] hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {intents.length === 0 && (
          <div className="text-center py-8 text-[var(--color-secondary)] text-sm">
            暂无意图，点击"新增意图"创建
          </div>
        )}
      </div>
    </div>
  )
}

export default IntentManager

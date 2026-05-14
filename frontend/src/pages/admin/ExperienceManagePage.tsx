import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit3, Trash2, X, Loader2, ChevronRight, Calendar } from 'lucide-react'
import {
  useExperiences,
  useCreateExperience,
  useUpdateExperience,
  useDeleteExperience,
} from '@/hooks/useExperiences'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { CreateExperienceRequest } from '@/api/experiences'
import type { WorkExperience } from '@/types'
import { Portal } from '@/components/Portal'

interface ExperienceFormData {
  type: 'study' | 'internship' | 'work'
  companyName: string
  position: string
  startDate: string
  endDate: string
  description: string
}

const emptyFormData: ExperienceFormData = {
  type: 'work',
  companyName: '',
  position: '',
  startDate: '',
  endDate: '',
  description: '',
}

export const ExperienceManagePage = () => {
  const { data: experiences, isLoading } = useExperiences()
  const createMutation = useCreateExperience()
  const updateMutation = useUpdateExperience()
  const deleteMutation = useDeleteExperience()

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExperience, setEditingExperience] = useState<WorkExperience | null>(null)
  const [formData, setFormData] = useState<ExperienceFormData>(emptyFormData)
  const [isSaving, setIsSaving] = useState(false)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<WorkExperience | null>(null)

  // Pre-fill form when editing
  useEffect(() => {
    if (editingExperience) {
      let type: 'study' | 'internship' | 'work' = editingExperience.type as any
      if (!['study', 'internship', 'work'].includes(type)) {
        type = 'work'
      }
      setFormData({
        type,
        companyName: editingExperience.companyName,
        position: editingExperience.position,
        startDate: editingExperience.startDate.split('T')[0] ?? editingExperience.startDate,
        endDate: editingExperience.endDate
          ? (editingExperience.endDate.split('T')[0] ?? editingExperience.endDate)
          : '',
        description: editingExperience.description ?? '',
      })
    } else {
      setFormData(emptyFormData)
    }
  }, [editingExperience])

  const handleOpenAdd = () => {
    setEditingExperience(null)
    setFormData(emptyFormData)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (experience: WorkExperience) => {
    setEditingExperience(experience)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingExperience(null)
  }

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!formData.companyName.trim() || !formData.position.trim() || !formData.startDate) {
      toast.error('请填写必填字段')
      return
    }

    setIsSaving(true)
    try {
      const payload: CreateExperienceRequest = {
        type: formData.type,
        companyName: formData.companyName,
        position: formData.position,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        description: formData.description,
      }

      if (editingExperience) {
        await updateMutation.mutateAsync({ id: editingExperience.id, data: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      handleCloseModal()
    } catch {
      // Error handled in mutation
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      // Error handled in mutation
    }
  }

  const sortedExperiences = experiences
    ? [...experiences].sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )
    : []

  return (
    <div className="space-y-[var(--space-xl)]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-primary)]">工作经历</h1>
          <p className="text-[var(--color-secondary)] mt-1">管理和编辑您的工作经历信息</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 h-11 px-[var(--space-lg)] bg-[var(--color-accent)] text-[var(--color-bg)] rounded-[var(--radius-md)] text-sm font-semibold
            hover:bg-[var(--color-accent)]/90 hover:shadow-md transition-all duration-[var(--duration-base)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          <span>添加经历</span>
        </button>
      </motion.div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[var(--color-secondary)]">
        <Link to="/admin/dashboard" className="hover:text-[var(--color-accent)] transition-colors">
          仪表盘
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[var(--color-primary)] font-medium">工作经历</span>
      </nav>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-[var(--space-md)]">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-lg)] p-[var(--space-md)] animate-pulse"
            >
              <div className="h-5 w-48 bg-[var(--color-bg-secondary)] rounded-[var(--radius-sm)] mb-2" />
              <div className="h-4 w-32 bg-[var(--color-bg-secondary)] rounded-[var(--radius-sm)] mb-2" />
              <div className="h-4 w-64 bg-[var(--color-bg-secondary)] rounded-[var(--radius-sm)]" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && sortedExperiences.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center py-[var(--space-3xl)] text-center bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] hover:shadow-md transition-shadow duration-[var(--duration-base)]"
        >
          <div className="w-20 h-20 rounded-[var(--radius-full)] bg-[var(--color-accent-soft)] flex items-center justify-center mb-[var(--space-lg)]">
            <Calendar className="w-10 h-10 text-[var(--color-accent)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-2">暂无工作经历</h2>
          <p className="text-sm text-[var(--color-secondary)] mb-[var(--space-lg)] max-w-sm">
            开始添加您的第一段工作经历，让访客更好地了解您的职业发展历程
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 h-11 px-[var(--space-lg)] bg-[var(--color-accent)] text-[var(--color-bg)] rounded-[var(--radius-md)] text-sm font-semibold
                hover:bg-[var(--color-accent)]/90 hover:shadow-md transition-all duration-[var(--duration-base)]"
          >
            <Plus className="w-4 h-4" />
            <span>添加第一段经历</span>
          </button>
        </motion.div>
      )}

      {/* Experience List */}
      {!isLoading && sortedExperiences.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-[var(--space-md)]"
        >
          {sortedExperiences.map((experience, index) => (
            <motion.div
              key={experience.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-lg)] p-[var(--space-lg)]
                  hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-accent)]/30 transition-all duration-[var(--duration-base)]"
            >
              <div className="flex items-start justify-between gap-[var(--space-md)]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-[var(--space-md)] mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-primary)]">
                        {experience.position}
                      </h3>
                      <p className="text-sm font-medium text-[var(--color-accent)] mt-1">
                        {experience.companyName}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)]">
                        <Calendar className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
                        <span className="text-xs font-medium text-[var(--color-secondary)]">
                          {formatDate(new Date(experience.startDate))} —{' '}
                          {experience.endDate ? formatDate(new Date(experience.endDate)) : '至今'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {experience.description && (
                    <p className="text-sm text-[var(--color-secondary)] leading-relaxed">
                      {experience.description}
                    </p>
                  )}
                  {experience.projects && experience.projects.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {experience.projects.map((project) => (
                        <span
                          key={project.id}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-[var(--color-accent)] bg-[var(--color-accent-soft)] rounded-[var(--radius-full)] hover:bg-[var(--color-accent-soft)]/80 transition-colors"
                        >
                          {project.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--duration-fast)]">
                  <button
                    onClick={() => handleOpenEdit(experience)}
                    className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)]
                        hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all duration-[var(--duration-fast)] hover:scale-110"
                    aria-label={`编辑 ${experience.companyName} - ${experience.position}`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(experience)}
                    className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)]
                        hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all duration-[var(--duration-fast)] hover:scale-110"
                    aria-label={`删除 ${experience.companyName} - ${experience.position}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile: always show action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0 sm:hidden">
                  <button
                    onClick={() => handleOpenEdit(experience)}
                    className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)]
                        hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all duration-[var(--duration-fast)]"
                    aria-label={`编辑 ${experience.companyName} - ${experience.position}`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(experience)}
                    className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)]
                        hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all duration-[var(--duration-fast)]"
                    aria-label={`删除 ${experience.companyName} - ${experience.position}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Edit/Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <Portal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-[var(--space-md)] bg-black/40"
              onClick={handleCloseModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="w-full max-w-lg bg-[var(--color-bg)] rounded-[var(--radius-xl)] shadow-[var(--shadow-card-strong)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-[var(--space-lg)] pt-[var(--space-lg)] pb-[var(--space-md)] border-b border-[var(--color-border-light)]">
                  <h2 className="text-lg font-semibold text-[var(--color-primary)]">
                    {editingExperience ? '编辑工作经历' : '添加工作经历'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-secondary)]
                      hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                    aria-label="关闭"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-[var(--space-lg)] py-[var(--space-md)] space-y-[var(--space-md)]">
                  {/* Type Selector */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="type"
                      className="block text-sm font-medium text-[var(--color-primary)]"
                    >
                      经历类型 <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleFormChange}
                      className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                        focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-colors appearance-none cursor-pointer"
                    >
                      <option value="work">工作</option>
                      <option value="internship">实习</option>
                      <option value="study">学习</option>
                    </select>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="companyName"
                      className="block text-sm font-medium text-[var(--color-primary)]"
                    >
                      公司名称 <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleFormChange}
                      className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                        placeholder:text-[var(--color-secondary)]
                        focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                      placeholder="请输入公司名称"
                    />
                  </div>

                  {/* Position */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="position"
                      className="block text-sm font-medium text-[var(--color-primary)]"
                    >
                      职位 <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                      id="position"
                      name="position"
                      type="text"
                      value={formData.position}
                      onChange={handleFormChange}
                      className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                        placeholder:text-[var(--color-secondary)]
                        focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                      placeholder="请输入职位"
                    />
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-md)]">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="startDate"
                        className="block text-sm font-medium text-[var(--color-primary)]"
                      >
                        开始日期 <span className="text-[var(--color-error)]">*</span>
                      </label>
                      <input
                        id="startDate"
                        name="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={handleFormChange}
                        className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                          focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="endDate"
                        className="block text-sm font-medium text-[var(--color-primary)]"
                      >
                        结束日期
                      </label>
                      <input
                        id="endDate"
                        name="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={handleFormChange}
                        className="w-full h-10 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                          focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-[var(--color-primary)]"
                    >
                      工作描述
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      rows={4}
                      className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border-medium)] bg-[var(--color-bg)] text-sm text-[var(--color-primary)]
                        placeholder:text-[var(--color-secondary)] resize-none
                        focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                      placeholder="请输入工作描述"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-[var(--space-sm)] px-[var(--space-lg)] py-[var(--space-md)] border-t border-[var(--color-border-light)]">
                  <button
                    onClick={handleCloseModal}
                    className="h-10 px-[var(--space-md)] border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-sm)] text-sm font-medium
                      hover:bg-[var(--color-bg-secondary)] transition-colors duration-[var(--duration-fast)]"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 h-10 px-[var(--space-md)] bg-[var(--color-primary)] text-[var(--color-bg)] rounded-[var(--radius-sm)] text-sm font-medium
                      hover:bg-[var(--color-secondary)] transition-all duration-[var(--duration-base)] ease-standard
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>{editingExperience ? '保存修改' : '添加'}</span>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <Portal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-[var(--space-md)] bg-black/40"
              onClick={() => setDeleteTarget(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="w-full max-w-sm bg-[var(--color-bg)] rounded-[var(--radius-xl)] shadow-[var(--shadow-card-strong)] p-[var(--space-lg)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-[var(--radius-full)] bg-[var(--color-error)]/10 flex items-center justify-center mb-[var(--space-md)]">
                    <Trash2 className="w-7 h-7 text-[var(--color-error)]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-1">
                    确认删除
                  </h2>
                  <p className="text-sm text-[var(--color-secondary)] mb-[var(--space-lg)]">
                    确定要删除 <strong>{deleteTarget.companyName}</strong> 的{' '}
                    <strong>{deleteTarget.position}</strong> 记录吗？此操作不可撤销。
                  </p>
                  <div className="flex items-center gap-[var(--space-sm)] w-full">
                    <button
                      onClick={() => setDeleteTarget(null)}
                      className="flex-1 h-10 border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-sm)] text-sm font-medium
                        hover:bg-[var(--color-bg-secondary)] transition-colors duration-[var(--duration-fast)]"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="flex-1 h-10 bg-[var(--color-error)] text-[var(--color-bg)] rounded-[var(--radius-sm)] text-sm font-medium
                        hover:opacity-90 transition-all duration-[var(--duration-fast)]
                        disabled:opacity-50 disabled:cursor-not-allowed
                        inline-flex items-center justify-center gap-2"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>删除</span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ExperienceManagePage

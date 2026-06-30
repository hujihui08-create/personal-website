import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, X, Loader2, ChevronRight, FileText, Upload, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { KnowledgeDoc } from '@/types'
import { knowledgeApi } from '@/api/knowledge'
import { Portal } from '@/components/Portal'

export const KnowledgeManagePage = () => {
  const queryClient = useQueryClient()

  const { data: docs, isLoading } = useQuery({
    queryKey: ['knowledge'],
    queryFn: knowledgeApi.listDocuments,
  })

  const uploadMutation = useMutation({
    mutationFn: knowledgeApi.uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] })
      toast.success('文档上传成功')
    },
    onError: (error: any) => {
      console.error('Upload error:', error)
      const errorMessage = error?.response?.data?.message || error?.message || '文档上传失败'
      toast.error(errorMessage)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: knowledgeApi.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] })
      setDeleteTarget(null)
      toast.success('文档删除成功')
    },
    onError: () => {
      toast.error('文档删除失败')
    },
  })

  const reindexMutation = useMutation({
    mutationFn: knowledgeApi.reindexAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] })
      toast.success('重新索引成功')
    },
    onError: () => {
      toast.error('重新索引失败')
    },
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeDoc | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleOpenUpload = () => {
    setSelectedFile(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedFile(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleFileDrop = (file: File) => {
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      await uploadMutation.mutateAsync(selectedFile)
      handleCloseModal()
    } catch (error) {
      console.error('上传失败', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
    } catch (error) {
      console.error('删除失败', error)
    }
  }

  const handleReindex = async () => {
    try {
      await reindexMutation.mutateAsync()
    } catch (error) {
      console.error('重新索引失败', error)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (date?: string) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('zh-CN')
  }

  return (
    <div className="space-y-[var(--space-xl)]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border-light)] pb-4 mb-6"
      >
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-primary)]">知识库管理</h1>
          <p className="text-sm text-[var(--color-secondary)]">管理AI助手的知识库文档</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReindex}
            disabled={reindexMutation.isPending}
            className="inline-flex items-center gap-2 h-11 px-[var(--space-md)] border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-md)] text-sm font-semibold
            hover:bg-[var(--color-bg-secondary)] transition-all duration-[var(--duration-base)]
            disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${reindexMutation.isPending ? 'animate-spin' : ''}`} />
            <span>重新索引</span>
          </button>
          <button
            onClick={handleOpenUpload}
            className="inline-flex items-center gap-2 h-11 px-[var(--space-lg)] bg-[var(--color-accent)] text-[var(--color-bg)] rounded-[var(--radius-md)] text-sm font-semibold
            hover:bg-[var(--color-accent)]/90 hover:shadow-md transition-all duration-[var(--duration-base)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            <span>上传文档</span>
          </button>
        </div>
      </motion.div>

      <nav className="flex items-center gap-1 text-sm text-[var(--color-secondary)]">
        <Link to="/admin/dashboard" className="hover:text-[var(--color-accent)] transition-colors">
          仪表盘
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[var(--color-primary)] font-medium">知识库管理</span>
      </nav>

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

      {!isLoading && docs?.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center py-[var(--space-3xl)] text-center bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] hover:shadow-md transition-shadow duration-[var(--duration-base)]"
        >
          <div className="w-20 h-20 rounded-[var(--radius-full)] bg-[var(--color-accent-soft)] flex items-center justify-center mb-[var(--space-lg)]">
            <FileText className="w-10 h-10 text-[var(--color-accent)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-2">暂无文档</h2>
          <p className="text-sm text-[var(--color-secondary)] mb-[var(--space-lg)] max-w-sm">
            上传您的第一个文档，让AI助手了解您的信息
          </p>
          <button
            onClick={handleOpenUpload}
            className="inline-flex items-center gap-2 h-11 px-[var(--space-lg)] bg-[var(--color-accent)] text-[var(--color-bg)] rounded-[var(--radius-md)] text-sm font-semibold
                hover:bg-[var(--color-accent)]/90 hover:shadow-md transition-all duration-[var(--duration-base)]"
          >
            <Plus className="w-4 h-4" />
            <span>上传第一个文档</span>
          </button>
        </motion.div>
      )}

      {!isLoading && docs && docs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-[var(--space-md)]"
        >
          {docs.map((doc, index) => (
            <motion.div
              key={doc.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-lg)] p-[var(--space-lg)]
                hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-accent)]/30 transition-all duration-[var(--duration-base)]"
            >
              <div className="flex items-start justify-between gap-[var(--space-md)]">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-[var(--color-accent)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-1 truncate">
                      {doc.filename}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-secondary)]">
                      {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                      {doc.created_at && <span>上传于 {formatDate(doc.created_at)}</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setDeleteTarget(doc)}
                  className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)]
                    hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all duration-[var(--duration-fast)] hover:scale-110"
                  aria-label={`删除 ${doc.filename}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <Portal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-[var(--space-md)] bg-black/40 overflow-y-auto"
              onClick={handleCloseModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="w-full max-w-md bg-[var(--color-bg)] rounded-[var(--radius-xl)] shadow-[var(--shadow-card-strong)] overflow-hidden my-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-[var(--space-lg)] pt-[var(--space-lg)] pb-[var(--space-md)] border-b border-[var(--color-border-light)]">
                  <h2 className="text-lg font-semibold text-[var(--color-primary)]">上传文档</h2>
                  <button
                    onClick={handleCloseModal}
                    className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-secondary)]
                      hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                    aria-label="关闭"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="px-[var(--space-lg)] py-[var(--space-md)]">
                  <div className="space-y-4">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDragOver(true)
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setDragOver(false)
                        const file = e.dataTransfer.files[0]
                        if (file) handleFileDrop(file)
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-[var(--radius-lg)] p-6 text-center cursor-pointer transition-colors
												${
                          dragOver
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                            : 'border-[var(--color-border-medium)] hover:border-[var(--color-accent)]'
                        }`}
                    >
                      <input
                        type="file"
                        id="doc-file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.txt,.md,.xls,.xlsx"
                        disabled={uploadMutation.isPending}
                      />
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-[var(--radius-full)] bg-[var(--color-accent-soft)] flex items-center justify-center mb-3">
                          <Upload className="w-6 h-6 text-[var(--color-accent)]" />
                        </div>
                        <span className="text-sm font-medium text-[var(--color-primary)]">
                          拖拽文件到此处或点击上传
                        </span>
                        <span className="text-xs text-[var(--color-secondary)] mt-1">
                          支持 PDF、Word、Excel、TXT、Markdown 格式
                        </span>
                      </div>
                    </div>

                    {selectedFile && (
                      <div className="flex items-center gap-3 p-3 bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)]">
                        <FileText className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-primary)] truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-[var(--color-secondary)]">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="text-[var(--color-secondary)] hover:text-[var(--color-error)]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-[var(--space-sm)] px-[var(--space-lg)] py-[var(--space-md)] border-t border-[var(--color-border-light)]">
                  <button
                    onClick={handleCloseModal}
                    className="h-10 px-[var(--space-md)] border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-sm)] text-sm font-medium
                      hover:bg-[var(--color-bg-secondary)] transition-colors duration-[var(--duration-fast)]"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploadMutation.isPending}
                    className="inline-flex items-center gap-2 h-10 px-[var(--space-md)] bg-[var(--color-primary)] text-[var(--color-bg)] rounded-[var(--radius-sm)] text-sm font-medium
                      hover:bg-[var(--color-secondary)] transition-all duration-[var(--duration-base)] ease-standard
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>上传</span>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>

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
                    确定要删除 <strong>{deleteTarget.filename}</strong> 吗？此操作不可撤销。
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

export default KnowledgeManagePage

import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Trash2, FileArchive, ExternalLink, Loader2, X, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Prototype } from '@/types'
import { prototypeApi } from '@/api/prototypes'
import { Portal } from '@/components/Portal'

export const PrototypeManagePage = () => {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: prototypes, isLoading } = useQuery({
    queryKey: ['prototypes'],
    queryFn: prototypeApi.list,
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [prototypeName, setPrototypeName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Prototype | null>(null)

  const uploadMutation = useMutation({
    mutationFn: ({ file, name }: { file: File; name?: string }) =>
      prototypeApi.upload(file, name || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prototypes'] })
      toast.success('原型上传成功')
      setSelectedFile(null)
      setPrototypeName('')
    },
    onError: (error: any) => {
      console.error('Upload error:', error)
      const errorMessage = error?.response?.data?.message || error?.message || '原型上传失败'
      toast.error(errorMessage)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: prototypeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prototypes'] })
      setDeleteTarget(null)
      toast.success('原型删除成功')
    },
    onError: (error: any) => {
      console.error('Delete error:', error)
      const errorMessage = error?.response?.data?.message || error?.message || '原型删除失败'
      toast.error(errorMessage)
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!prototypeName) {
        const nameWithoutExt = file.name.replace(/\.zip$/i, '')
        setPrototypeName(nameWithoutExt)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        name: prototypeName || undefined,
      })
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

  const handleClearFile = () => {
    setSelectedFile(null)
    setPrototypeName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (date?: string) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

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
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-primary)]">原型管理</h1>
          <p className="text-[var(--color-secondary)] mt-1">
            上传和管理 HTML 原型项目，预览页面效果
          </p>
        </div>
      </motion.div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-[var(--color-secondary)]">
        <Link to="/admin/dashboard" className="hover:text-[var(--color-accent)] transition-colors">
          仪表盘
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[var(--color-primary)] font-medium">原型管理</span>
      </nav>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-[var(--space-lg)]"
      >
        <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-[var(--space-md)]">
          上传原型
        </h2>

        <div className="flex flex-col gap-[var(--space-md)]">
          {/* Name Input */}
          <div>
            <label
              htmlFor="prototype-name"
              className="block text-sm font-medium text-[var(--color-primary)] mb-[var(--space-xs)]"
            >
              原型名称
            </label>
            <input
              id="prototype-name"
              type="text"
              value={prototypeName}
              onChange={(e) => setPrototypeName(e.target.value)}
              placeholder="输入原型名称（可选，默认使用文件名）"
              disabled={uploadMutation.isPending}
              className="w-full h-10 px-[var(--space-sm)] border border-[var(--color-border-medium)] rounded-[var(--radius-md)] text-sm text-[var(--color-primary)] placeholder:text-[var(--color-secondary)]/50
                bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-[var(--duration-fast)]"
            />
          </div>

          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-[var(--radius-lg)] p-6 text-center transition-colors duration-[var(--duration-fast)]
              ${
                selectedFile
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                  : 'border-[var(--color-border-medium)] hover:border-[var(--color-accent)]'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="prototype-file"
              className="hidden"
              accept=".zip"
              onChange={handleFileSelect}
              disabled={uploadMutation.isPending}
            />
            <label htmlFor="prototype-file" className="cursor-pointer flex flex-col items-center">
              <div className="w-12 h-12 rounded-[var(--radius-full)] bg-[var(--color-accent-soft)] flex items-center justify-center mb-3">
                <FileArchive className="w-6 h-6 text-[var(--color-accent)]" />
              </div>
              <span className="text-sm font-medium text-[var(--color-primary)]">
                点击选择 ZIP 文件
              </span>
              <span className="text-xs text-[var(--color-secondary)] mt-1">
                支持 .zip 格式，包含 index.html 的原型项目
              </span>
            </label>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)]">
              <FileArchive className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-primary)] truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-[var(--color-secondary)]">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                onClick={handleClearFile}
                disabled={uploadMutation.isPending}
                className="text-[var(--color-secondary)] hover:text-[var(--color-error)] transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="inline-flex items-center gap-2 h-11 px-[var(--space-lg)] bg-[var(--color-accent)] text-[var(--color-bg)] rounded-[var(--radius-md)] text-sm font-semibold
                hover:bg-[var(--color-accent)]/90 hover:shadow-md transition-all duration-[var(--duration-base)]
                focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{uploadMutation.isPending ? '上传中...' : '上传原型'}</span>
            </button>
          </div>
        </div>
      </motion.div>

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
      {!isLoading && (!prototypes || prototypes.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center py-[var(--space-3xl)] text-center bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] hover:shadow-md transition-shadow duration-[var(--duration-base)]"
        >
          <div className="w-20 h-20 rounded-[var(--radius-full)] bg-[var(--color-accent-soft)] flex items-center justify-center mb-[var(--space-lg)]">
            <FileArchive className="w-10 h-10 text-[var(--color-accent)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-2">暂无原型</h2>
          <p className="text-sm text-[var(--color-secondary)] mb-[var(--space-lg)] max-w-sm">
            上传您的第一个 HTML 原型项目，即可在此管理和预览
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 h-11 px-[var(--space-lg)] bg-[var(--color-accent)] text-[var(--color-bg)] rounded-[var(--radius-md)] text-sm font-semibold
              hover:bg-[var(--color-accent)]/90 hover:shadow-md transition-all duration-[var(--duration-base)]"
          >
            <Upload className="w-4 h-4" />
            <span>上传第一个原型</span>
          </button>
        </motion.div>
      )}

      {/* Prototype List */}
      {!isLoading && prototypes && prototypes.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-[var(--space-md)]"
        >
          <h2 className="text-lg font-semibold text-[var(--color-primary)]">原型列表</h2>

          {prototypes.map((proto, index) => (
            <motion.div
              key={proto.id}
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
                    <FileArchive className="w-6 h-6 text-[var(--color-accent)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-1 truncate">
                      {proto.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-secondary)]">
                      <span>{proto.file_count} 个文件</span>
                      {proto.created_at && <span>上传于 {formatDate(proto.created_at)}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-[var(--space-sm)] flex-shrink-0">
                  {/* Preview Link */}
                  <a
                    href="/prototypes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-9 px-[var(--space-sm)] border border-[var(--color-border-medium)] text-[var(--color-primary)] rounded-[var(--radius-md)] text-sm font-medium
                      hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-all duration-[var(--duration-fast)]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">预览</span>
                  </a>

                  {/* Delete Button */}
                  <button
                    onClick={() => setDeleteTarget(proto)}
                    className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)]
                      hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all duration-[var(--duration-fast)] hover:scale-110"
                    aria-label={`删除 ${proto.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

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
                    确定要删除原型 <strong>{deleteTarget.name}</strong> 吗？此操作不可撤销。
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

export default PrototypeManagePage

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getResume, uploadResume, deleteResume } from '@/api/resume'
import { toast } from 'sonner'

export function useResume() {
  return useQuery({
    queryKey: ['resume'],
    queryFn: () => getResume().then(res => res.data),
    staleTime: 3600000,
  })
}

export function useUploadResume() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => uploadResume(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume'] })
      toast.success('简历已上传')
    },
    onError: () => {
      toast.error('简历上传失败', { description: '请稍后重试' })
    },
  })
}

export function useDeleteResume() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteResume(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume'] })
      toast.success('简历已删除')
    },
    onError: () => {
      toast.error('简历删除失败', { description: '请稍后重试' })
    },
  })
}

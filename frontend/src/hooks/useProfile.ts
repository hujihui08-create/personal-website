import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfile, updateProfile, uploadAvatar } from '@/api/profile'
import type { Profile } from '@/types'
import { toast } from 'sonner'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile().then(res => res.data),
    staleTime: 3600000,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Profile>) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('个人资料已更新')
    },
    onError: () => {
      toast.error('更新失败', { description: '请稍后重试' })
    },
  })
}

export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('头像已更新')
    },
    onError: () => {
      toast.error('头像上传失败', { description: '请稍后重试' })
    },
  })
}

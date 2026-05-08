import client from './client'
import type { Profile, ApiResponse } from '../types'

export function getProfile(): Promise<ApiResponse<Profile>> {
  return client.get('/profile').then(res => res.data)
}

export function updateProfile(data: Partial<Profile>): Promise<ApiResponse<Profile>> {
  return client.put('/profile', data).then(res => res.data)
}

export function uploadAvatar(file: File): Promise<ApiResponse<{ avatar_url: string }>> {
  const formData = new FormData()
  formData.append('file', file)
  return client.post('/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)
}

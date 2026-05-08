import client from './client'
import type { Resume, ApiResponse } from '../types'

export function getResume(): Promise<ApiResponse<Resume | null>> {
  return client.get('/resume').then(res => res.data)
}

export function uploadResume(file: File): Promise<ApiResponse<Resume>> {
  const formData = new FormData()
  formData.append('file', file)
  return client.post('/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data)
}

export function deleteResume(): Promise<ApiResponse<null>> {
  return client.delete('/resume').then(res => res.data)
}

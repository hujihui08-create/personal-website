export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

export interface Profile {
  name: string
  title: string
  bio: string
  avatar_url: string
  github_url: string
  linkedin_url: string
  email: string
  skills: string[]
}

export interface Project {
	id: number
	name: string
	type: 'enterprise' | 'personal'
	startDate?: string
	endDate?: string
	summary: string
	description: string
	coverImage: string
	images: string[]
	githubUrl: string
	demoUrl: string
	tags: string[]
	sortOrder: number
	createdAt: string
	updatedAt: string
}

export interface PaginatedProjectsResponse {
	items: Project[]
	total: number
	page: number
	pageSize: number
}

export interface WorkExperience {
  id: number
  type?: 'study' | 'internship' | 'work'
  company_name: string
  position: string
  start_date: string
  end_date: string | null
  description: string
  sort_order: number
  projects?: Project[]
}

export interface Resume {
  file_url: string
  file_name: string
}

export interface ScheduleSetting {
  id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Slot {
  time: string;
  available: boolean;
  reason?: string;
}

export interface SlotsResponse {
  date: string;
  weekday: string;
  is_available: boolean;
  message?: string;
  slots?: Slot[];
}

export interface Booking {
  id: number;
  company_name: string;
  company_location: string;
  booking_date: string;
  booking_time: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  reject_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
	id: string
	role: 'user' | 'assistant'
	content: string
	timestamp: string
}

export interface Notification {
	id: number
	type: string
	title: string
	content: string
	is_read: boolean
	related_id?: number
	created_at: string
}

export interface PaginatedNotificationsResponse {
	items: Notification[]
	total: number
	page: number
	page_size: number
}

export interface UnreadCountResponse {
	count: number
}

// === Agent Types ===

export interface AgentChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface AgentChatSession {
  session_id: string
  messages: AgentChatMessage[]
}

export interface AgentChatRequest {
  message: string
  session_id?: string
  stream?: boolean
}

export interface AgentChatStreamChunk {
  type: 'thinking' | 'chunk' | 'done'
  content?: string
  session_id?: string
}

export interface AgentClearRequest {
  session_id: string
}

// === Knowledge Types ===

export interface KnowledgeDoc {
  id: number
  filename: string
  file_size?: number
  created_at: string
}

export interface KnowledgeDocListResponse {
  code: number
  message: string
  data: KnowledgeDoc[]
}

// === Config Types ===

export interface Config {
  id: number
  key: string
  value: string
  category: string
  created_at: string
  updated_at: string
}

export interface LLMConfig {
  provider: string
  api_key: string
  base_url: string
  model: string
  temperature: number
  max_tokens: number
}

export interface EmbeddingConfig {
  provider: string
  api_key: string
  base_url: string
  model: string
}

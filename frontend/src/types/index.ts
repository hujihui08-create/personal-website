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
  avatarUrl: string
  githubUrl: string
  linkedinUrl: string
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
  isFeatured: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  prds?: ProjectPrd[]
}

export interface ProjectPrd {
  id: number
  project_id: number
  name: string
  prd_url: string
  prototype_id?: number | null
  sort_order: number
  created_at: string
  updated_at: string
  prototype?: Prototype | null
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
  companyName: string
  position: string
  startDate: string
  endDate: string | null
  description: string
  sortOrder: number
  projects?: ExperienceProjectBrief[]
}

export interface ExperienceProjectBrief {
  id: number
  name: string
  summary: string
  coverImage: string
  demoUrl: string
  githubUrl: string
}

export interface Resume {
  file_url: string
  file_name: string
}

export interface ScheduleSetting {
  id: number
  weekday: number
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Slot {
  time: string
  available: boolean
  reason?: string
}

export interface SlotsResponse {
  date: string
  weekday: string
  is_available: boolean
  message?: string
  slots?: Slot[]
}

export interface Booking {
  id: number
  company_name: string
  company_location: string
  booking_date: string
  booking_time: string
  contact_name: string
  contact_email: string
  contact_phone: string
  notes?: string
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled'
  reject_reason?: string
  cancel_reason?: string
  created_at: string
  updated_at: string
}

export interface UpdateBookingByUserRequest {
  company_name?: string
  company_location?: string
  booking_date?: string
  booking_time?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
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
  visitor_id?: string
  stream?: boolean
}

export interface AgentChatStreamChunk {
  type: 'thinking' | 'chunk' | 'done' | 'booking_result' | 'booking_list' | 'booking_form'
  content?: string
  session_id?: string
  data?: BookingResultData | BookingFormChunkData
}

export interface BookingFormChunkData {
  step: 'date_time' | 'info'
}

export interface BookingFormState {
  step: 'date_time' | 'info' | 'result'
  selectedDate: string
  selectedTime: string
  formData: BookingFormData
  result?: BookingResultData
}

export interface BookingFormData {
  company_name: string
  company_location: string
  contact_name: string
  contact_phone: string
  contact_email: string
  notes: string
}

export interface BookingResultData {
  type?: string
  action?: string
  id?: number
  status?: string
  company_name?: string
  company_location?: string
  booking_date?: string
  booking_time?: string
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  notes?: string
  reject_reason?: string
  created_at?: string
  updated_at?: string
  bookings?: Array<{
    id: number
    status: string
    company_name: string
    company_location: string
    booking_date: string
    booking_time: string
    contact_name: string
    contact_phone: string
    contact_email?: string
  }>
}

export interface AgentClearRequest {
  session_id: string
  visitor_id: string
}

export interface AgentSessionMeta {
  session_id: string
  title: string
  created_at: string
  updated_at: string
}

// === Agent Debug Types ===

export interface DebugChatRequest {
  message: string
  agent_type?: string
  show_retrieval?: boolean
  show_prompt?: boolean
  custom_prompt_id?: number
}

export interface IntentClassification {
  agent_type: string
  confidence: number
  method: string
}

export interface RetrievalInfo {
  query: string
  embedding_time_ms: number
  retrieval_time_ms: number
  document_count: number
  documents: string[]
}

export interface GenerationStats {
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  response_time_ms: number
  prompt_template?: string
}

export interface DebugInfo {
  intent_classification: IntentClassification
  retrieval: RetrievalInfo
  generation: GenerationStats
}

export interface DebugChatResponse {
  answer: string
  debug_info: DebugInfo
}

export interface DebugHistoryItem {
  id: number
  query: string
  answer: string
  agent_type: string
  created_at: string
}

// === Agent Prompt Types ===

export interface PromptTemplate {
  id: number
  agent_type: string
  name: string
  system_prompt: string
  context_template?: string
  is_default: boolean
  is_active: boolean
  created_by?: number
  created_at: string
  updated_at: string
}

export interface PromptCreateRequest {
  agent_type: string
  name: string
  system_prompt: string
  context_template?: string
}

export interface PromptUpdateRequest {
  name?: string
  system_prompt?: string
  context_template?: string
  is_active?: boolean
}

export interface TestWithPromptRequest {
  message: string
  show_retrieval?: boolean
  show_prompt?: boolean
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

// === Prototype Types (Deprecated: 原型文件现已归属 PRD，此类型将移除) ===

export interface Prototype {
  id: number
  name: string
  file_count: number
  storage_prefix: string
  created_at: string
}

// ============ Agent Config Center Types ============

export interface AgentIntent {
  id: number
  name: string
  label: string
  keywords: string // comma-separated
  sort_order: number
  prompt_id: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AgentTool {
  id: number
  name: string
  description: string
  parameters_json: string // JSON Schema string
  handler_type: string
  is_active: boolean
}

export interface AgentConfig {
  id: number
  status: 'draft' | 'published'
  version: string
  config: AgentConfigData
  created_at: string
  published_at: string | null
}

export interface AgentConfigData {
  llm: {
    temperature: number
    maxTokens: number
    topK: number
  }
  harness: {
    maxSteps: number
    timeoutSeconds: number
    loopStrategy: 'react'
  }
  tools: {
    enabled: string[]
  }
}

export interface AgentConfigVersion {
  id: number
  version: string
  status: string
  published_at: string | null
  created_at: string
}

export interface HarnessStep {
  step_number: number
  llm_output: string
  tool_call: {
    name: string
    arguments: Record<string, unknown>
  } | null
  tool_result: Record<string, unknown> | null
  duration_ms: number
  token_usage: {
    prompt: number
    completion: number
    total: number
  } | null
}

export interface HarnessTrace {
  steps: HarnessStep[]
  total_duration_ms: number
  total_tokens: number
}

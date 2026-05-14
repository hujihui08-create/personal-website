package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"

	"github.com/sashabaranov/go-openai"
)

// ──────────────────────────── Response types ────────────────────────────

type DebugResponse struct {
	Answer    string    `json:"answer"`
	DebugInfo DebugInfo `json:"debug_info"`
}

type DebugInfo struct {
	IntentClassification interface{} `json:"intent_classification"`
	Retrieval            interface{} `json:"retrieval"`
	Generation           interface{} `json:"generation"`
}

type RetrievalDebugInfo struct {
	Query           string   `json:"query"`
	EmbeddingTimeMs int64    `json:"embedding_time_ms"`
	RetrievalTimeMs int64    `json:"retrieval_time_ms"`
	DocumentCount   int      `json:"document_count"`
	Documents       []string `json:"documents,omitempty"`
}

type GenerationDebugInfo struct {
	Model            string `json:"model"`
	PromptTokens     int    `json:"prompt_tokens"`
	CompletionTokens int    `json:"completion_tokens"`
	TotalTokens      int    `json:"total_tokens"`
	ResponseTimeMs   int64  `json:"response_time_ms"`
	PromptTemplate   string `json:"prompt_template,omitempty"`
}

type IntentClassResult struct {
	AgentType  string  `json:"agent_type"`
	Confidence float64 `json:"confidence"`
	Method     string  `json:"method"`
}

type RetrievalTestResponse struct {
	Query           string      `json:"query"`
	EmbeddingTimeMs int64       `json:"embedding_time_ms"`
	RetrievalTimeMs int64       `json:"retrieval_time_ms"`
	Documents       interface{} `json:"documents"`
}

// ──────────────────────────── Service ────────────────────────────

type AgentDebugService struct {
	ragService       *RAGService
	embeddingService *EmbeddingService
	configService    *ConfigService
	debugLogRepo     *repository.AgentDebugLogRepo
	promptRepo       *repository.AgentPromptRepo
	profileRepo      *repository.ProfileRepository
	projectRepo      *repository.ProjectRepository
}

func NewAgentDebugService(
	ragService *RAGService,
	embeddingService *EmbeddingService,
	configService *ConfigService,
	debugLogRepo *repository.AgentDebugLogRepo,
	promptRepo *repository.AgentPromptRepo,
	profileRepo *repository.ProfileRepository,
	projectRepo *repository.ProjectRepository,
) *AgentDebugService {
	return &AgentDebugService{
		ragService:       ragService,
		embeddingService: embeddingService,
		configService:    configService,
		debugLogRepo:     debugLogRepo,
		promptRepo:       promptRepo,
		profileRepo:      profileRepo,
		projectRepo:      projectRepo,
	}
}

// ──────────────────────────── Intent classification ────────────────────────────

func (s *AgentDebugService) classifyIntent(query string) IntentClassResult {
	lower := strings.ToLower(query)

	// 简历/工作经历相关
	resumeKeywords := []string{"简历", "resume", "cv", "工作经历", "工作履历", "项目经验", "技能", "技术栈",
		"work experience", "project", "skill", "background", "experience"}
	for _, kw := range resumeKeywords {
		if strings.Contains(lower, kw) {
			return IntentClassResult{AgentType: "resume", Confidence: 0.85, Method: "keyword"}
		}
	}

	// 预约/会议相关
	bookingKeywords := []string{"预约", "预订", "booking", "meeting", "会议", "时间", "schedule",
		"安排", "约个时间", "见面"}
	for _, kw := range bookingKeywords {
		if strings.Contains(lower, kw) {
			return IntentClassResult{AgentType: "booking", Confidence: 0.85, Method: "keyword"}
		}
	}

	// 项目/作品相关
	projectKeywords := []string{"项目", "project", "作品", "portfolio", "案例", "case"}
	for _, kw := range projectKeywords {
		if strings.Contains(lower, kw) {
			return IntentClassResult{AgentType: "project", Confidence: 0.85, Method: "keyword"}
		}
	}

	return IntentClassResult{AgentType: "general", Confidence: 0.5, Method: "keyword"}
}

// ──────────────────────────── LLM client helpers ────────────────────────────

func (s *AgentDebugService) createLLMClient(llmConfig *model.LLMConfig) *openai.Client {
	clientConfig := openai.DefaultConfig(llmConfig.APIKey)
	if llmConfig.BaseURL != "" {
		clientConfig.BaseURL = llmConfig.BaseURL
	}
	return openai.NewClientWithConfig(clientConfig)
}

// ──────────────────────────── Prompt building ────────────────────────────

func (s *AgentDebugService) buildSystemPrompt(
	agentType string,
	contexts []string,
	customPromptID *uint,
) string {
	profileSection := s.buildProfileSection()
	projectSection := s.buildProjectsSection()

	if customPromptID != nil {
		prompt, err := s.promptRepo.FindByID(*customPromptID)
		if err == nil && prompt != nil {
			sb := &strings.Builder{}
			sb.WriteString(prompt.SystemPrompt)
			sb.WriteString("\n\n")

			if profileSection != "" {
				sb.WriteString(profileSection)
				sb.WriteString("\n")
			}
			if projectSection != "" {
				sb.WriteString(projectSection)
				sb.WriteString("\n")
			}

			if len(contexts) > 0 {
				if prompt.ContextTemplate != "" {
					sb.WriteString(prompt.ContextTemplate)
					sb.WriteString("\n\n")
					for i, ctx := range contexts {
						sb.WriteString(fmt.Sprintf("[%d] %s\n\n", i+1, ctx))
					}
				} else {
					sb.WriteString("以下是知识库中的参考信息：\n")
					for i, ctx := range contexts {
						sb.WriteString(fmt.Sprintf("[%d] %s\n\n", i+1, ctx))
					}
				}
				sb.WriteString("---\n\n")
			}

			return sb.String()
		}
		log.Printf("[AgentDebugService] 未找到自定义 Prompt id=%d，使用默认 Prompt", *customPromptID)
	}

	if agentType != "" {
		prompt, err := s.promptRepo.FindDefaultByAgentType(agentType)
		if err == nil && prompt != nil {
			sb := &strings.Builder{}
			sb.WriteString(prompt.SystemPrompt)
			sb.WriteString("\n\n")

			if profileSection != "" {
				sb.WriteString(profileSection)
				sb.WriteString("\n")
			}
			if projectSection != "" {
				sb.WriteString(projectSection)
				sb.WriteString("\n")
			}

			if len(contexts) > 0 {
				if prompt.ContextTemplate != "" {
					sb.WriteString(prompt.ContextTemplate)
					sb.WriteString("\n\n")
					for i, ctx := range contexts {
						sb.WriteString(fmt.Sprintf("[%d] %s\n\n", i+1, ctx))
					}
				} else {
					sb.WriteString("以下是知识库中的参考信息：\n")
					for i, ctx := range contexts {
						sb.WriteString(fmt.Sprintf("[%d] %s\n\n", i+1, ctx))
					}
				}
				sb.WriteString("---\n\n")
			}

			return sb.String()
		}
	}

	sb := &strings.Builder{}
	sb.WriteString("你是胡冀徽的智能助手，专门回答关于胡冀徽个人背景、工作经验、技术栈和项目的问题。\n")
	sb.WriteString("当用户询问\"你是谁\"或类似问题时，请回答：\"我是胡冀徽的智能助手，可以帮助您了解胡冀徽的工作经验、项目经验、工作履历等。\"\n\n")

	if profileSection != "" {
		sb.WriteString(profileSection)
		sb.WriteString("\n")
	}
	if projectSection != "" {
		sb.WriteString(projectSection)
		sb.WriteString("\n")
	}

	if len(contexts) > 0 {
		sb.WriteString("以下是知识库中的参考信息，请主要基于这些信息回答用户：\n")
		for i, ctx := range contexts {
			sb.WriteString(fmt.Sprintf("[%d] %s\n\n", i+1, ctx))
		}
		sb.WriteString("---\n\n")
	} else {
		sb.WriteString("目前知识库中没有相关信息。\n\n")
	}

	sb.WriteString("请用专业、简洁的语言回答问题。请使用中文回答。\n")
	sb.WriteString("回答时请遵守以下格式要求：\n")
	sb.WriteString("1. 不要使用 ** 标记\n")
	sb.WriteString("2. 不要使用 - 列表\n")
	sb.WriteString("3. 如需列出要点，请使用数字排序（1. 2. 3. 等）\n")
	sb.WriteString("4. 如果用户提出与胡冀徽（个人背景、工作经验、技术栈、项目经历、工作履历等）完全不相关的问题，请礼貌拒绝回答，并引导用户询问与胡冀徽相关的问题。例如回复：\"我只负责解答关于胡冀徽的问题，请询问与胡冀徽工作经历、项目经验等相关的内容。\"\n")

	return sb.String()
}

func (s *AgentDebugService) buildProfileSection() string {
	if s.profileRepo == nil {
		return ""
	}

	profile, err := s.profileRepo.GetProfile()
	if err != nil {
		log.Printf("[AgentDebugService] 获取 Profile 失败: %v", err)
		return ""
	}

	sb := &strings.Builder{}
	sb.WriteString("以下是胡冀徽的个人联系方式信息，当用户询问联系方式时请基于此回答：\n")
	sb.WriteString(fmt.Sprintf("姓名: %s\n", profile.Name))
	if profile.Title != "" {
		sb.WriteString(fmt.Sprintf("职位: %s\n", profile.Title))
	}
	if profile.Email != "" {
		sb.WriteString(fmt.Sprintf("邮箱: %s\n", profile.Email))
	}
	if profile.GithubURL != "" {
		sb.WriteString(fmt.Sprintf("GitHub: %s\n", profile.GithubURL))
	}
	if profile.LinkedinURL != "" {
		sb.WriteString(fmt.Sprintf("LinkedIn: %s\n", profile.LinkedinURL))
	}
	sb.WriteString("\n")

	return sb.String()
}

func (s *AgentDebugService) buildProjectsSection() string {
	if s.projectRepo == nil {
		return ""
	}

	projects, err := s.projectRepo.ListFeatured(100)
	if err != nil {
		log.Printf("[AgentDebugService] 获取 Projects 失败: %v", err)
		return ""
	}

	if len(projects) == 0 {
		return ""
	}

	sb := &strings.Builder{}
	sb.WriteString(fmt.Sprintf("以下是胡冀徽的项目列表（共 %d 个），当用户询问项目相关问题时请基于此回答：\n", len(projects)))
	for i, p := range projects {
		sb.WriteString(fmt.Sprintf("%d. 项目名称: %s\n", i+1, p.Name))
		sb.WriteString(fmt.Sprintf("   类型: %s\n", p.Type))
		sb.WriteString(fmt.Sprintf("   摘要: %s\n", p.Summary))
		if len(p.Tags) > 0 {
			tags := ""
			for j, t := range p.Tags {
				if j > 0 {
					tags += ", "
				}
				tags += t
			}
			sb.WriteString(fmt.Sprintf("   标签: %s\n", tags))
		}
		if p.GitHubURL != "" {
			sb.WriteString(fmt.Sprintf("   GitHub: %s\n", p.GitHubURL))
		}
		if p.DemoURL != "" {
			sb.WriteString(fmt.Sprintf("   Demo: %s\n", p.DemoURL))
		}
		sb.WriteString("\n")
	}

	return sb.String()
}

// ──────────────────────────── Core: DebugChat ────────────────────────────

func (s *AgentDebugService) DebugChat(
	adminID uint,
	message string,
	agentType string,
	showRetrieval bool,
	showPrompt bool,
	customPromptID *uint,
) (*DebugResponse, error) {
	log.Printf("[AgentDebugService] DebugChat admin=%d message=%s agentType=%s", adminID, message, agentType)

	// ── Step 1: Intent classification ──
	var intentResult IntentClassResult
	effectiveAgentType := agentType

	if agentType == "" {
		intentResult = s.classifyIntent(message)
		effectiveAgentType = intentResult.AgentType
	} else {
		intentResult = IntentClassResult{
			AgentType:  agentType,
			Confidence: 1.0,
			Method:     "forced",
		}
	}

	log.Printf("[AgentDebugService] 意图分类结果: agentType=%s confidence=%.2f method=%s",
		intentResult.AgentType, intentResult.Confidence, intentResult.Method)

	// ── Step 2: RAG retrieval ──
	embeddingStart := time.Now()
	embedding, err := s.embeddingService.CreateEmbedding(message)
	embeddingTimeMs := time.Since(embeddingStart).Milliseconds()
	if err != nil {
		log.Printf("[AgentDebugService] 创建 embedding 失败: %v", err)
		embeddingTimeMs = 0
		// 即使 embedding 失败，也继续（没有文档上下文）
	}

	var relevantDocs []string
	retrievalStart := time.Now()
	if embedding != nil {
		relevantDocs, err = s.ragService.RetrieveRelevantDocs(message, 3)
		if err != nil {
			log.Printf("[AgentDebugService] RAG 检索失败: %v", err)
			relevantDocs = nil
		}
	}
	retrievalTimeMs := time.Since(retrievalStart).Milliseconds()

	retrievalDebug := RetrievalDebugInfo{
		Query:           message,
		EmbeddingTimeMs: embeddingTimeMs,
		RetrievalTimeMs: retrievalTimeMs,
		DocumentCount:   len(relevantDocs),
	}
	if showRetrieval {
		retrievalDebug.Documents = relevantDocs
	}

	log.Printf("[AgentDebugService] RAG 检索: embedding=%dms retrieval=%dms docCount=%d",
		embeddingTimeMs, retrievalTimeMs, len(relevantDocs))

	// ── Step 3: Build prompt ──
	systemPrompt := s.buildSystemPrompt(effectiveAgentType, relevantDocs, customPromptID)

	// ── Step 4: Call LLM (non-streaming) ──
	llmConfig, err := s.configService.GetLLMConfig()
	if err != nil {
		return nil, fmt.Errorf("获取 LLM 配置失败: %w", err)
	}
	if llmConfig.APIKey == "" {
		return nil, fmt.Errorf("LLM API Key 未配置")
	}

	client := s.createLLMClient(llmConfig)
	llmModel := llmConfig.Model
	if llmModel == "" {
		llmModel = string(openai.GPT4oMini)
	}

	req := openai.ChatCompletionRequest{
		Model: llmModel,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: systemPrompt},
			{Role: openai.ChatMessageRoleUser, Content: message},
		},
		Temperature: float32(llmConfig.Temperature),
		MaxTokens:   llmConfig.MaxTokens,
	}

	llmStart := time.Now()
	resp, err := client.CreateChatCompletion(context.Background(), req)
	responseTimeMs := time.Since(llmStart).Milliseconds()

	if err != nil {
		log.Printf("[AgentDebugService] LLM 调用失败: %v", err)
		return nil, fmt.Errorf("LLM 调用失败: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("LLM 返回空结果")
	}

	answer := resp.Choices[0].Message.Content
	log.Printf("[AgentDebugService] LLM 响应: %d tokens, %d ms",
		resp.Usage.TotalTokens, responseTimeMs)

	// ── Step 5: Build generation debug info ──
	genDebug := GenerationDebugInfo{
		Model:            llmModel,
		PromptTokens:     resp.Usage.PromptTokens,
		CompletionTokens: resp.Usage.CompletionTokens,
		TotalTokens:      resp.Usage.TotalTokens,
		ResponseTimeMs:   responseTimeMs,
	}
	if showPrompt {
		genDebug.PromptTemplate = systemPrompt
	}

	// ── Step 6: Save debug log to DB ──
	intentJSON, _ := json.Marshal(intentResult)
	retrievalJSON, _ := json.Marshal(retrievalDebug)
	genJSON, _ := json.Marshal(genDebug)

	debugLog := &model.AgentDebugLog{
		AdminID:              adminID,
		Query:                message,
		Answer:               answer,
		AgentType:            effectiveAgentType,
		IntentClassification: intentJSON,
		RetrievalInfo:        retrievalJSON,
		GenerationStats:      genJSON,
		CustomPromptID:       customPromptID,
		CreatedAt:            time.Now(),
	}

	if err := s.debugLogRepo.Create(debugLog); err != nil {
		log.Printf("[AgentDebugService] 保存调试日志失败: %v", err)
		// 非致命错误，不阻塞返回
	}

	// ── Step 7: Return result ──
	return &DebugResponse{
		Answer: answer,
		DebugInfo: DebugInfo{
			IntentClassification: intentResult,
			Retrieval:            retrievalDebug,
			Generation:           genDebug,
		},
	}, nil
}

// ──────────────────────────── GetDebugHistory ────────────────────────────

func (s *AgentDebugService) GetDebugHistory(adminID uint, page, pageSize int) ([]model.AgentDebugLog, int64, error) {
	log.Printf("[AgentDebugService] GetDebugHistory admin=%d page=%d pageSize=%d", adminID, page, pageSize)
	return s.debugLogRepo.FindByAdminID(adminID, page, pageSize)
}

// ──────────────────────────── DeleteDebugHistory ────────────────────────────

func (s *AgentDebugService) DeleteDebugHistory(adminID uint, id *uint) (int64, error) {
	if id != nil {
		// 删除单条记录 - 需要校验该记录属于该 admin
		existing, err := s.debugLogRepo.FindByID(*id)
		if err != nil {
			return 0, fmt.Errorf("调试记录不存在: %w", err)
		}
		if existing.AdminID != adminID {
			return 0, fmt.Errorf("无权删除该调试记录")
		}
		if err := s.debugLogRepo.DeleteByID(*id); err != nil {
			return 0, err
		}
		log.Printf("[AgentDebugService] 删除单条调试记录 id=%d admin=%d", *id, adminID)
		return 1, nil
	}

	// 删除该 admin 的所有记录
	count, err := s.debugLogRepo.DeleteAllByAdminID(adminID)
	if err != nil {
		return 0, err
	}
	log.Printf("[AgentDebugService] 删除全部调试记录 admin=%d count=%d", adminID, count)
	return count, nil
}

// ──────────────────────────── TestRetrieval ────────────────────────────

func (s *AgentDebugService) TestRetrieval(query string, topK int) (*RetrievalTestResponse, error) {
	log.Printf("[AgentDebugService] TestRetrieval query=%s topK=%d", query, topK)

	if topK <= 0 {
		topK = 3
	}

	// Step 1: Embed query
	embeddingStart := time.Now()
	embedding, err := s.embeddingService.CreateEmbedding(query)
	embeddingTimeMs := time.Since(embeddingStart).Milliseconds()
	if err != nil {
		return nil, fmt.Errorf("创建 embedding 失败: %w", err)
	}

	// Step 2: Vector search
	retrievalStart := time.Now()
	docs, err := s.ragService.RetrieveRelevantDocs(query, topK)
	retrievalTimeMs := time.Since(retrievalStart).Milliseconds()
	if err != nil {
		return nil, fmt.Errorf("向量检索失败: %w", err)
	}

	_ = embedding // embedding already used inside RetrieveRelevantDocs; timing captured above

	log.Printf("[AgentDebugService] TestRetrieval 完成: embedding=%dms retrieval=%dms docCount=%d",
		embeddingTimeMs, retrievalTimeMs, len(docs))

	return &RetrievalTestResponse{
		Query:           query,
		EmbeddingTimeMs: embeddingTimeMs,
		RetrievalTimeMs: retrievalTimeMs,
		Documents:       docs,
	}, nil
}

package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	models "portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"

	"github.com/redis/go-redis/v9"
	"github.com/sashabaranov/go-openai"
)

type ChatService struct {
	chatSessionRepo *repository.ChatSessionRepository
	ragService      *RAGService
	configService   *ConfigService
	redisClient     *redis.Client
	profileRepo     *repository.ProfileRepository
	projectRepo     *repository.ProjectRepository
	promptRepo      *repository.AgentPromptRepo
	bookingService  *BookingService
	intentRepo      *repository.AgentIntentRepo
}

func NewChatService(
	chatSessionRepo *repository.ChatSessionRepository,
	ragService *RAGService,
	configService *ConfigService,
	redisClient *redis.Client,
	profileRepo *repository.ProfileRepository,
	projectRepo *repository.ProjectRepository,
	promptRepo *repository.AgentPromptRepo,
	bookingService *BookingService,
	intentRepo *repository.AgentIntentRepo,
) *ChatService {
	return &ChatService{
		chatSessionRepo: chatSessionRepo,
		ragService:      ragService,
		configService:   configService,
		redisClient:     redisClient,
		profileRepo:     profileRepo,
		projectRepo:     projectRepo,
		promptRepo:      promptRepo,
		bookingService:  bookingService,
		intentRepo:      intentRepo,
	}
}

type ChatMessageResponse struct {
	Role      string `json:"role"`
	Content   string `json:"content"`
	Timestamp string `json:"timestamp"`
}

type ChatSessionResponse struct {
	SessionID string                `json:"session_id"`
	Messages  []ChatMessageResponse `json:"messages"`
}

func (s *ChatService) CheckDailyLimit(userID string) (bool, error) {
	return true, nil
}

func (s *ChatService) IncrementDailyCount(userID string) error {
	return nil
}

func (s *ChatService) GetOrCreateSession(sessionID string, visitorID string) (*models.ChatSession, error) {
	if sessionID == "" {
		session := &models.ChatSession{
			SessionID: generateSessionID(),
			VisitorID: visitorID,
			Title:     "",
			Messages:  models.ChatMessages{},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if err := s.chatSessionRepo.Create(session); err != nil {
			return nil, err
		}
		return session, nil
	}

	session, err := s.chatSessionRepo.FindBySessionID(sessionID)
	if err != nil {
		session := &models.ChatSession{
			SessionID: sessionID,
			VisitorID: visitorID,
			Title:     "",
			Messages:  models.ChatMessages{},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if err := s.chatSessionRepo.Create(session); err != nil {
			return nil, err
		}
		return session, nil
	}

	return session, nil
}

func (s *ChatService) DeleteSession(sessionID, visitorID string) error {
	return s.chatSessionRepo.DeleteBySessionIDAndVisitor(sessionID, visitorID)
}

type SessionMeta struct {
	SessionID string `json:"session_id"`
	Title     string `json:"title"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func (s *ChatService) ListSessions(visitorID string) ([]SessionMeta, error) {
	sessions, err := s.chatSessionRepo.FindByVisitorID(visitorID)
	if err != nil {
		return nil, err
	}

	result := make([]SessionMeta, len(sessions))
	for i, sess := range sessions {
		result[i] = SessionMeta{
			SessionID: sess.SessionID,
			Title:     sess.Title,
			CreatedAt: sess.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt: sess.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}
	return result, nil
}

type StreamMessageType string

const (
	StreamMessageTypeThinking      StreamMessageType = "thinking"
	StreamMessageTypeChunk         StreamMessageType = "chunk"
	StreamMessageTypeDone          StreamMessageType = "done"
	StreamMessageTypeBookingResult StreamMessageType = "booking_result"
)

type StreamMessage struct {
	Type      StreamMessageType `json:"type"`
	Content   string            `json:"content,omitempty"`
	SessionID string            `json:"session_id,omitempty"`
	Data      interface{}       `json:"data,omitempty"`
}

func (s *ChatService) ChatStream(
	ctx context.Context,
	session *models.ChatSession,
	userMessage string,
) (<-chan StreamMessage, error) {
	respChan := make(chan StreamMessage, 100)

	log.Printf("[ChatService] 收到用户消息: %s", userMessage)

	userMsg := models.ChatMessage{
		Role:      "user",
		Content:   userMessage,
		Timestamp: time.Now(),
	}
	session.Messages = append(session.Messages, userMsg)

	// 自动生成会话标题（使用用户第一条消息的前30个字）
	if session.Title == "" {
		title := userMessage
		runes := []rune(title)
		if len(runes) > 30 {
			title = string(runes[:30]) + "..."
		}
		session.Title = title
		s.chatSessionRepo.UpdateTitle(session.SessionID, title)
	}

	go func() {
		defer close(respChan)

		// 发送思考中状态
		respChan <- StreamMessage{Type: StreamMessageTypeThinking, Content: ""}

		llmConfig, err := s.configService.GetLLMConfig()
		if err != nil {
			log.Printf("[ChatService] 获取 LLM 配置失败: %v", err)
			respChan <- StreamMessage{Type: StreamMessageTypeChunk, Content: "抱歉，服务配置异常。"}
			assistantMsg := models.ChatMessage{
				Role:      "assistant",
				Content:   "抱歉，服务配置异常。",
				Timestamp: time.Now(),
			}
			session.Messages = append(session.Messages, assistantMsg)
			s.chatSessionRepo.Update(session)
			respChan <- StreamMessage{Type: StreamMessageTypeDone, SessionID: session.SessionID}
			return
		}

		if llmConfig.APIKey == "" {
			log.Printf("[ChatService] LLM API Key 未配置")
			respChan <- StreamMessage{Type: StreamMessageTypeChunk, Content: "AI 助手功能暂未开启，请在管理后台配置 LLM API Key 后再试。"}
			assistantMsg := models.ChatMessage{
				Role:      "assistant",
				Content:   "AI 助手功能暂未开启，请在管理后台配置 LLM API Key 后再试。",
				Timestamp: time.Now(),
			}
			session.Messages = append(session.Messages, assistantMsg)
			s.chatSessionRepo.Update(session)
			respChan <- StreamMessage{Type: StreamMessageTypeDone, SessionID: session.SessionID}
			return
		}

		log.Printf("[ChatService] 开始检索相关文档，用户问题: %s", userMessage)
		relevantDocs, err := s.ragService.RetrieveRelevantDocs(userMessage, 3)
		if err != nil {
			log.Printf("[ChatService] 检索相关文档失败: %v", err)
		} else {
			log.Printf("[ChatService] 找到 %d 个相关文档", len(relevantDocs))
			for i, doc := range relevantDocs {
				log.Printf("[ChatService] 文档 %d: %s", i+1, doc)
			}
		}

		intentResult := s.classifyIntent(userMessage)
		agentType := intentResult.AgentType

		// 多轮对话意图保持：如果当前消息意图为 general，但会话历史中包含 booking 上下文，
		// 则继续使用 booking 意图，确保预约流程在多轮对话中不会中断
		if agentType == "general" && s.isBookingInSession(session) {
			agentType = "booking"
			log.Printf("[ChatService] 会话历史包含预约上下文，保持 booking 意图")
		}

		log.Printf("[ChatService] 意图分类结果: agentType=%s confidence=%.2f method=%s",
			agentType, intentResult.Confidence, intentResult.Method)

		systemPrompt := s.buildSystemPrompt(agentType, relevantDocs, userMessage)
		log.Printf("[ChatService] 系统提示词: %s", systemPrompt)

		messages := []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: systemPrompt,
			},
		}

		for _, m := range session.Messages {
			role := openai.ChatMessageRoleUser
			if m.Role == "assistant" {
				role = openai.ChatMessageRoleAssistant
			}
			messages = append(messages, openai.ChatCompletionMessage{
				Role:    role,
				Content: m.Content,
			})
		}

		clientConfig := openai.DefaultConfig(llmConfig.APIKey)
		if llmConfig.BaseURL != "" {
			clientConfig.BaseURL = llmConfig.BaseURL
		}
		client := openai.NewClientWithConfig(clientConfig)

		model := llmConfig.Model
		if model == "" {
			model = string(openai.GPT4oMini)
		}

		req := openai.ChatCompletionRequest{
			Model:       model,
			Messages:    messages,
			Stream:      true,
			Temperature: float32(llmConfig.Temperature),
			MaxTokens:   llmConfig.MaxTokens,
		}

		llmCtx, llmCancel := context.WithTimeout(ctx, 60*time.Second)
		defer llmCancel()

		stream, err := client.CreateChatCompletionStream(llmCtx, req)
		if err != nil {
			log.Printf("[ChatService] LLM 调用失败: %v", err)
			apiKeyPreview := llmConfig.APIKey
			if len(apiKeyPreview) > 10 {
				apiKeyPreview = apiKeyPreview[:10] + "..."
			}
			log.Printf("[ChatService] 配置详情 - BaseURL: %s, Model: %s, APIKey: %s",
				llmConfig.BaseURL, llmConfig.Model, apiKeyPreview)
			respChan <- StreamMessage{Type: StreamMessageTypeChunk, Content: "抱歉，服务暂时不可用。"}
			assistantMsg := models.ChatMessage{
				Role:      "assistant",
				Content:   "抱歉，服务暂时不可用。",
				Timestamp: time.Now(),
			}
			session.Messages = append(session.Messages, assistantMsg)
			s.chatSessionRepo.Update(session)
			respChan <- StreamMessage{Type: StreamMessageTypeDone, SessionID: session.SessionID}
			return
		}
		defer stream.Close()

		var fullResponse strings.Builder
		var suppressing bool

		bookingStartTags := []string{"[BOOKING_CREATE]", "[BOOKING_QUERY]", "[BOOKING_CANCEL]", "[BOOKING_LIST]", "[BOOKING_INTENT]"}
		bookingEndTags := []string{"[/BOOKING_CREATE]", "[/BOOKING_QUERY]", "[/BOOKING_CANCEL]", "[/BOOKING_LIST]", "[/BOOKING_INTENT]"}

		containsAny := func(s string, substrs []string) bool {
			for _, sub := range substrs {
				if strings.Contains(s, sub) {
					return true
				}
			}
			return false
		}

		for {
			select {
			case <-ctx.Done():
				saveAndDone(respChan, session, &fullResponse, s.chatSessionRepo)
				return
			default:
				resp, err := stream.Recv()
				if err != nil {
					saveAndDone(respChan, session, &fullResponse, s.chatSessionRepo)
					return
				}

				if len(resp.Choices) > 0 {
					content := resp.Choices[0].Delta.Content
					if content != "" {
						fullResponse.WriteString(content)

						if !suppressing && containsAny(fullResponse.String(), bookingStartTags) {
							suppressing = true
						} else if !suppressing {
							respChan <- StreamMessage{Type: StreamMessageTypeChunk, Content: content}
						}

						if suppressing && containsAny(fullResponse.String(), bookingEndTags) {
							suppressing = false
							afterLastEnd := ""
							fullStr := fullResponse.String()
							lastEnd := 0
							for _, endTag := range bookingEndTags {
								if idx := strings.LastIndex(fullStr, endTag); idx >= 0 {
									end := idx + len(endTag)
									if end > lastEnd {
										lastEnd = end
									}
								}
							}
							if lastEnd < len(fullStr) {
								afterLastEnd = fullStr[lastEnd:]
								respChan <- StreamMessage{Type: StreamMessageTypeChunk, Content: afterLastEnd}
							}
						}
					}

					if resp.Choices[0].FinishReason != "" {
						cleanResponse := stripBookingTags(fullResponse.String())

						// 始终尝试解析 booking 标签，不依赖意图分类结果
						// 多轮对话中后续消息的意图可能被分类为 general，但 LLM 仍可能输出 booking 标签
						bookingText, bookingData := s.parseAndExecuteBookingAction(fullResponse.String())
						if bookingData != nil {
							// 检查是否为 booking_form 类型（包含 step 字段）
							if dataMap, ok := bookingData.(map[string]interface{}); ok {
								if _, hasStep := dataMap["step"]; hasStep {
									respChan <- StreamMessage{Type: "booking_form", Data: bookingData}
								} else {
									respChan <- StreamMessage{Type: StreamMessageTypeBookingResult, Data: bookingData}
								}
							} else {
								respChan <- StreamMessage{Type: StreamMessageTypeBookingResult, Data: bookingData}
							}
						}
						if bookingText != "" {
							for _, ch := range bookingText {
								respChan <- StreamMessage{Type: StreamMessageTypeChunk, Content: string(ch)}
							}
						}

						assistantMsg := models.ChatMessage{
							Role:      "assistant",
							Content:   cleanResponse,
							Timestamp: time.Now(),
						}
						session.Messages = append(session.Messages, assistantMsg)
						s.chatSessionRepo.Update(session)
						respChan <- StreamMessage{Type: StreamMessageTypeDone, SessionID: session.SessionID}
						return
					}
				}
			}
		}
	}()

	return respChan, nil
}

func (s *ChatService) parseAndExecuteBookingAction(fullResponse string) (string, interface{}) {
	if s.bookingService == nil {
		return "", nil
	}

	// Try BOOKING_INTENT - trigger interactive card flow
	if idx := strings.Index(fullResponse, "[BOOKING_INTENT]"); idx >= 0 {
		endIdx := strings.Index(fullResponse, "[/BOOKING_INTENT]")
		if endIdx > idx {
			jsonStr := strings.TrimSpace(fullResponse[idx+len("[BOOKING_INTENT]") : endIdx])
			var data struct {
				Step string `json:"step"`
			}
			if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
				log.Printf("[ChatService] 解析 [BOOKING_INTENT] JSON 失败: %v, 原始 JSON: %s", err, jsonStr)
			} else {
				cardData := map[string]interface{}{
					"step": data.Step,
				}
				return "", cardData
			}
		}
	}

	// Try CREATE action
	if idx := strings.Index(fullResponse, "[BOOKING_CREATE]"); idx >= 0 {
		endIdx := strings.Index(fullResponse, "[/BOOKING_CREATE]")
		if endIdx > idx {
			jsonStr := strings.TrimSpace(fullResponse[idx+len("[BOOKING_CREATE]") : endIdx])
			var data struct {
				CompanyName     string `json:"company_name"`
				CompanyLocation string `json:"company_location"`
				BookingDate     string `json:"booking_date"`
				BookingTime     string `json:"booking_time"`
				ContactName     string `json:"contact_name"`
				ContactEmail    string `json:"contact_email"`
				ContactPhone    string `json:"contact_phone"`
				Notes           string `json:"notes"`
			}
			if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
				log.Printf("[ChatService] 解析 [BOOKING_CREATE] JSON 失败: %v, 原始 JSON: %s", err, jsonStr)
			} else {
				booking, err := s.bookingService.CreateBooking(
					data.CompanyName, data.CompanyLocation, data.BookingDate, data.BookingTime,
					data.ContactName, data.ContactEmail, data.ContactPhone, data.Notes, "agent",
				)
				if err != nil {
					log.Printf("[ChatService] 执行预约创建失败: %v", err)
					return fmt.Sprintf("\u9884\u7ea6\u5931\u8d25\uff1a%v", err), nil
				}
				cardData := map[string]interface{}{
					"action":           "created",
					"id":               booking.ID,
					"status":           booking.Status,
					"company_name":     booking.CompanyName,
					"company_location": booking.CompanyLocation,
					"booking_date":     booking.BookingDate,
					"booking_time":     booking.BookingTime,
					"contact_name":     booking.ContactName,
					"contact_phone":    booking.ContactPhone,
					"contact_email":    booking.ContactEmail,
					"notes":            booking.Notes,
					"created_at":       booking.CreatedAt,
				}
				text := fmt.Sprintf("\u9884\u7ea6\u6210\u529f\uff01\u60a8\u7684\u9884\u7ea6\u7f16\u53f7\u662f %d\uff0c\u9884\u7ea6\u65e5\u671f\u4e3a %s %s\u3002\u8bf7\u4fdd\u5b58\u6b64\u7f16\u53f7\uff0c\u540e\u7eed\u53ef\u901a\u8fc7\u7f16\u53f7\u548c\u624b\u673a\u53f7\u67e5\u8be2\u6216\u53d6\u6d88\u9884\u7ea6\u3002", booking.ID, booking.BookingDate, booking.BookingTime)
				return text, cardData
			}
		}
	}

	// Try LIST action (by phone)
	if idx := strings.Index(fullResponse, "[BOOKING_LIST]"); idx >= 0 {
		endIdx := strings.Index(fullResponse, "[/BOOKING_LIST]")
		if endIdx > idx {
			jsonStr := strings.TrimSpace(fullResponse[idx+len("[BOOKING_LIST]") : endIdx])
			var data struct {
				Phone string `json:"phone"`
			}
			if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
				log.Printf("[ChatService] 解析 [BOOKING_LIST] JSON 失败: %v, 原始 JSON: %s", err, jsonStr)
			} else {
				bookings, err := s.bookingService.ListBookingsByPhone(data.Phone)
				if err != nil {
					log.Printf("[ChatService] 查询预约列表失败 (phone=%s): %v", data.Phone, err)
					return "查询预约列表失败，请稍后再试。", nil
				}
				cardData := map[string]interface{}{
					"type":     "booking_list",
					"bookings": bookings,
				}
				text := fmt.Sprintf("找到 %d 条预约记录，请告诉我要取消哪一个（可以说编号或第几个）。", len(bookings))
				return text, cardData
			}
		}
	}

	// Try QUERY action
	if idx := strings.Index(fullResponse, "[BOOKING_QUERY]"); idx >= 0 {
		endIdx := strings.Index(fullResponse, "[/BOOKING_QUERY]")
		if endIdx > idx {
			jsonStr := strings.TrimSpace(fullResponse[idx+len("[BOOKING_QUERY]") : endIdx])
			var data struct {
				ID    uint   `json:"id"`
				Phone string `json:"phone"`
			}
			if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
				log.Printf("[ChatService] 解析 [BOOKING_QUERY] JSON 失败: %v, 原始 JSON: %s", err, jsonStr)
			} else if data.ID > 0 {
				// Exact query by ID + phone
				booking, err := s.bookingService.LookupBooking(data.ID, data.Phone)
				if err != nil {
					log.Printf("[ChatService] 查询预约失败 (id=%d): %v", data.ID, err)
					return "\u672a\u627e\u5230\u5339\u914d\u7684\u9884\u7ea6\uff0c\u8bf7\u68c0\u67e5\u9884\u7ea6\u7f16\u53f7\u548c\u624b\u673a\u53f7\u662f\u5426\u6b63\u786e\u3002", nil
				}
				cardData := map[string]interface{}{
					"action":           "lookup",
					"id":               booking.ID,
					"status":           booking.Status,
					"company_name":     booking.CompanyName,
					"company_location": booking.CompanyLocation,
					"booking_date":     booking.BookingDate,
					"booking_time":     booking.BookingTime,
					"contact_name":     booking.ContactName,
					"contact_phone":    booking.ContactPhone,
					"contact_email":    booking.ContactEmail,
					"notes":            booking.Notes,
					"reject_reason":    booking.RejectReason,
					"created_at":       booking.CreatedAt,
					"updated_at":       booking.UpdatedAt,
				}
				text := fmt.Sprintf("\u67e5\u8be2\u5230\u60a8\u7684\u9884\u7ea6\uff08\u7f16\u53f7 %d\uff09\uff0c\u8be6\u60c5\u5982\u4e0a\u3002", booking.ID)
				return text, cardData
			} else if data.Phone != "" {
				// List by phone only
				bookings, err := s.bookingService.ListBookingsByPhone(data.Phone)
				if err != nil {
					log.Printf("[ChatService] 按手机号查询预约列表失败 (phone=%s): %v", data.Phone, err)
					return "查询预约列表失败，请稍后再试。", nil
				}
				if len(bookings) == 0 {
					return "未找到该手机号对应的预约记录。", nil
				}
				cardData := map[string]interface{}{
					"type":     "booking_list",
					"bookings": bookings,
				}
				text := fmt.Sprintf("找到 %d 条预约记录，请告诉我要取消哪一个（可以说编号或第几个）。", len(bookings))
				return text, cardData
			}
		}
	}

	// Try CANCEL action
	if idx := strings.Index(fullResponse, "[BOOKING_CANCEL]"); idx >= 0 {
		endIdx := strings.Index(fullResponse, "[/BOOKING_CANCEL]")
		if endIdx > idx {
			jsonStr := strings.TrimSpace(fullResponse[idx+len("[BOOKING_CANCEL]") : endIdx])
			var data struct {
				ID    uint   `json:"id"`
				Phone string `json:"phone"`
			}
			if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
				log.Printf("[ChatService] 解析 [BOOKING_CANCEL] JSON 失败: %v, 原始 JSON: %s", err, jsonStr)
			} else {
				var booking *models.BookingResponse
				var err error
				if data.Phone != "" {
					booking, err = s.bookingService.CancelBookingByUser(data.ID, data.Phone, "")
				} else {
					booking, err = s.bookingService.CancelBookingByID(data.ID)
				}
				if err != nil {
					log.Printf("[ChatService] 取消预约失败 (id=%d): %v", data.ID, err)
					return fmt.Sprintf("\u53d6\u6d88\u9884\u7ea6\u5931\u8d25\uff1a%v", err), nil
				}
				cardData := map[string]interface{}{
					"action": "cancelled",
					"id":     booking.ID,
					"status": booking.Status,
				}
				text := fmt.Sprintf("\u9884\u7ea6\u7f16\u53f7 %d \u5df2\u6210\u529f\u53d6\u6d88\u3002", data.ID)
				return text, cardData
			}
		}
	}

	return "", nil
}

// isBookingInSession 检查会话历史是否处于预约上下文中
// 如果历史消息中包含预约相关关键词或 LLM 的预约引导回复，则认为当前处于预约会话
func (s *ChatService) isBookingInSession(session *models.ChatSession) bool {
	bookingKeywords := []string{
		"预约", "预订", "booking", "面试", "meeting", "时间安排",
		"公司名称", "公司地点", "预约日期", "预约时段", "联系电话",
	}
	bookingAssistantPatterns := []string{
		"预约编号", "预约成功", "预约详情", "预约已取消",
		"请告诉我", "请提供", "公司名称", "预约日期",
	}

	for _, msg := range session.Messages {
		lower := strings.ToLower(msg.Content)
		// 检查用户消息是否包含预约关键词
		if msg.Role == "user" {
			for _, kw := range bookingKeywords {
				if strings.Contains(lower, kw) {
					return true
				}
			}
		}
		// 检查助手回复是否包含预约引导内容
		if msg.Role == "assistant" {
			for _, pattern := range bookingAssistantPatterns {
				if strings.Contains(msg.Content, pattern) {
					return true
				}
			}
		}
	}

	return false
}

func (s *ChatService) classifyIntent(query string) IntentClassResult {
	lower := strings.ToLower(query)

	// Try to load intents from DB
	if s.intentRepo != nil {
		intents, err := s.intentRepo.FindActive()
		if err == nil && len(intents) > 0 {
			for _, intent := range intents {
				if intent.Name == "general" || intent.Keywords == "" {
					continue // skip general, it's the fallback
				}
				keywords := strings.Split(intent.Keywords, ",")
				for _, kw := range keywords {
					if strings.TrimSpace(kw) != "" && strings.Contains(lower, strings.TrimSpace(kw)) {
						return IntentClassResult{
							AgentType:  intent.Name,
							Confidence: 0.85,
							Method:     "keyword",
						}
					}
				}
			}
		}
	}

	// Fallback: hardcoded intents if DB is empty (same as before but keep as safety net)
	resumeKeywords := []string{"简历", "resume", "cv", "工作经历", "工作履历", "项目经验", "技能", "work experience", "skill", "background", "experience"}
	for _, kw := range resumeKeywords {
		if strings.Contains(lower, kw) {
			return IntentClassResult{AgentType: "resume", Confidence: 0.85, Method: "keyword"}
		}
	}

	bookingKeywords := []string{"预约", "预订", "booking", "meeting", "会议", "时间", "schedule", "安排", "约个时间", "见面", "取消", "查询预约", "我的预约"}
	for _, kw := range bookingKeywords {
		if strings.Contains(lower, kw) {
			return IntentClassResult{AgentType: "booking", Confidence: 0.85, Method: "keyword"}
		}
	}

	projectKeywords := []string{"项目", "project", "作品", "portfolio", "案例", "case"}
	for _, kw := range projectKeywords {
		if strings.Contains(lower, kw) {
			return IntentClassResult{AgentType: "project", Confidence: 0.85, Method: "keyword"}
		}
	}

	techKeywords := []string{"技术栈", "技术", "tech stack", "编程语言", "框架", "后端", "前端", "数据库", "云计算", "devops", "开发", "架构", "微服务", "容器", "kubernetes", "docker"}
	for _, kw := range techKeywords {
		if strings.Contains(lower, kw) {
			return IntentClassResult{AgentType: "tech", Confidence: 0.85, Method: "keyword"}
		}
	}

	return IntentClassResult{AgentType: "general", Confidence: 0.5, Method: "keyword"}
}

func (s *ChatService) buildSystemPrompt(agentType string, contexts []string, userMessage string) string {
	profileSection := s.buildProfileSection()
	projectSection := s.buildProjectsSection()
	techStackSection := s.buildTechStackSection()

	var contextText string
	if len(contexts) > 0 {
		csb := &strings.Builder{}
		csb.WriteString("以下是知识库中的参考信息，请主要基于这些信息回答用户：\n")
		for i, ctx := range contexts {
			csb.WriteString(fmt.Sprintf("[%d] %s\n\n", i+1, ctx))
		}
		csb.WriteString("---\n")
		contextText = csb.String()
	}

	var template string

	// booking 意图：优先从 DB 加载自定义 Prompt，但必须包含 [BOOKING_CREATE] 标签
	// 如果不含标签（旧版 Prompt），则回退到内置模板
	if agentType == "booking" && s.promptRepo != nil {
		if prompt, err := s.promptRepo.FindDefaultByAgentType("booking"); err == nil && prompt != nil {
			if strings.Contains(prompt.SystemPrompt, "[BOOKING_CREATE]") {
				template = prompt.SystemPrompt
				log.Printf("[ChatService] 使用 DB 中的 booking Prompt: id=%d name=%s", prompt.ID, prompt.Name)
			} else {
				log.Printf("[ChatService] DB 中的 booking Prompt 不含 [BOOKING_CREATE] 标签（旧版），回退到内置模板")
			}
		}
	}

	if template == "" && agentType == "booking" {
		template = `你就是胡冀徽本人。你现在直接以胡冀徽的身份与访客对话。你可以帮助用户了解胡冀徽的个人背景、技术栈、工作经验、项目经历，也可以帮助用户完成面试预约的创建、查询和取消。

当用户询问"你是谁"或类似问题时，请回答："我是胡冀徽，一名全栈开发工程师。你可以向我了解我的个人背景、技术栈、项目经历，也可以通过我进行面试预约。有什么可以帮你的？"

请用专业、友好的语言与用户对话，使用中文回答。始终使用"我"来指代自己，使用"你"来称呼访客。

## 创建预约（优先使用交互式卡片）
用户想要预约时（如说"我要预约"、"预约面试"等），请**直接**输出以下标签触发交互式卡片，由系统卡片接管后续信息收集：
[BOOKING_INTENT]{"step":"date_time"}[/BOOKING_INTENT]
输出标签后不需要再追问用户，卡片会自动引导用户选择时间和填写信息。

当用户不是通过表达预约意图而是直接提供了完整的预约信息（如"帮我预约7月5号14:00，XX公司，张三，138xxx..."），则按以下原有流程使用 [BOOKING_CREATE] 标签：

- 公司名称
- 公司地点
- 预约日期（格式 YYYY-MM-DD，如 2026-05-20，仅限工作日周一至周五）
- 预约时段（如 09:00, 10:00, 11:00, 14:00, 15:00, 16:00）
- 联系人姓名
- 联系电话（11位手机号）
- 联系邮箱（可选）
- 备注（可选）

信息收集齐全后，在回答末尾加上（请务必放在单独一行，JSON 不要换行）：
[BOOKING_CREATE]{"company_name":"公司名","company_location":"地点","booking_date":"2026-05-20","booking_time":"09:00","contact_name":"姓名","contact_phone":"13800138000"}[/BOOKING_CREATE]

## 查询预约
查询预约有两种方式：
1. 用户知道预约编号和手机号 → 加上：
[BOOKING_QUERY]{"id":123456,"phone":"13800138000"}[/BOOKING_QUERY]
2. 用户只记得手机号 → 加上：
[BOOKING_QUERY]{"phone":"13800138000"}[/BOOKING_QUERY]  （返回该手机号所有预约列表）

## 取消预约
取消预约分为两个阶段：

第一阶段-确定目标：
- 如果用户知道预约编号 → 直接确认后加上：
  [BOOKING_CANCEL]{"id":123456}[/BOOKING_CANCEL]
- 如果用户不记得编号 → 先让用户提供手机号 → 发出查询：
  [BOOKING_LIST]{"phone":"13800138000"}[/BOOKING_LIST]  或 [BOOKING_QUERY]{"phone":"13800138000"}[/BOOKING_QUERY]
  → 系统会展示该手机号的所有预约列表 → 让用户指定要取消哪一个（说编号或第几个）

第二阶段-执行取消：
- 用户选定后，确认并加上：
  [BOOKING_CANCEL]{"id":42}[/BOOKING_CANCEL]  （只需编号，无需再提供手机号）

注意：标签必须放在回答的最末尾，JSON 放在一行内。不要在标签中包含任何多余的文字或换行。

重要格式要求：
- 回复中禁止使用 ** 等 markdown 加粗符号，统一使用纯文本。例如：说"编号 42"而不是"**编号 42**"
- 预约成功/查询成功后，已通过卡片展示的信息（编号、日期、时段、公司名称等）不要重复输出，只需简单引导语，如"预约成功！请保存编号，后续可通过编号和手机号查询或取消。"
- 预约查询成功后，只说"以下是您的预约详情"，详细信息由卡片展示，不要重复列出
- 对话中禁止出现 create_booking、query_booking、cancel_booking 等技术性工具名称

{{question}}`
		log.Printf("[ChatService] 使用内置 booking Prompt")
	}

	if template == "" && s.promptRepo != nil {
		if prompt, err := s.promptRepo.FindDefaultByAgentType(agentType); err == nil && prompt != nil {
			template = prompt.SystemPrompt
			log.Printf("[ChatService] 使用 agent_type=%s 的默认 Prompt: id=%d name=%s", agentType, prompt.ID, prompt.Name)
		}
	}

	if template == "" && agentType != "general" && s.promptRepo != nil {
		if prompt, err := s.promptRepo.FindDefaultByAgentType("general"); err == nil && prompt != nil {
			template = prompt.SystemPrompt
			log.Printf("[ChatService] 回退到 general 类型的默认 Prompt: id=%d name=%s", prompt.ID, prompt.Name)
		}
	}

	if template == "" {
		template = `你就是胡冀徽本人，专门回答关于你的个人背景、工作经验、技术栈、项目以及预约咨询的问题。
当用户询问"你是谁"或类似问题时，请回答："我是胡冀徽，一名全栈开发工程师。你可以向我了解我的个人背景、技术栈、项目经历，也可以通过我进行面试预约。有什么可以帮你的？"

{{profile}}

{{projects}}

{{tech_stack}}

{{context}}

{{question}}

请用专业、简洁的语言回答问题。请使用中文回答。
回答时请遵守以下格式要求：
1. 不要使用 ** 标记
2. 不要使用 - 列表
3. 如需列出要点，请使用数字排序（1. 2. 3. 等）
4. 你可以回答关于个人背景、工作经验、技术栈、项目经历、工作履历等相关问题。如果用户询问预约或咨询相关事宜（如面试时间、会议安排等），请告诉用户可以说"我要预约面试"来启动预约流程，或使用预约页面（/booking）自行操作。只有遇到与以上所有话题都完全无关的问题时，才请礼貌拒绝并引导用户询问相关话题。`
	}

	result := strings.ReplaceAll(template, "{{profile}}", profileSection)
	result = strings.ReplaceAll(result, "{{projects}}", projectSection)
	result = strings.ReplaceAll(result, "{{tech_stack}}", techStackSection)
	result = strings.ReplaceAll(result, "{{question}}", userMessage)
	result = strings.ReplaceAll(result, "{{context}}", contextText)

	result = strings.TrimSpace(result)

	return result
}

func (s *ChatService) buildProfileSection() string {
	if s.profileRepo == nil {
		return ""
	}

	profile, err := s.profileRepo.GetProfile()
	if err != nil {
		log.Printf("[ChatService] 获取 Profile 失败: %v", err)
		return ""
	}

	sb := &strings.Builder{}
	sb.WriteString("以下是你自己的个人信息，请用第一人称回答相关问题：\n")
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

func (s *ChatService) buildProjectsSection() string {
	if s.projectRepo == nil {
		return ""
	}

	projects, err := s.projectRepo.ListFeatured(100)
	if err != nil {
		log.Printf("[ChatService] 获取 Projects 失败: %v", err)
		return ""
	}

	if len(projects) == 0 {
		return ""
	}

	sb := &strings.Builder{}
	sb.WriteString(fmt.Sprintf("以下是你做过的项目（共 %d 个），当用户询问项目相关问题时请基于此回答：\n", len(projects)))
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

func (s *ChatService) buildTechStackSection() string {
	if s.projectRepo == nil {
		return ""
	}

	projects, err := s.projectRepo.ListFeatured(100)
	if err != nil {
		log.Printf("[ChatService] 获取 Projects 失败: %v", err)
		return ""
	}

	if len(projects) == 0 {
		return ""
	}

	tagSet := make(map[string]bool)
	for _, p := range projects {
		for _, t := range p.Tags {
			tagSet[t] = true
		}
	}

	if len(tagSet) == 0 {
		return ""
	}

	sb := &strings.Builder{}
	sb.WriteString(fmt.Sprintf("以下是胡冀徽的技术栈（共 %d 项），从各项目中汇总的标签：\n", len(tagSet)))
	i := 1
	for tag := range tagSet {
		sb.WriteString(fmt.Sprintf("%d. %s\n", i, tag))
		i++
	}
	sb.WriteString("\n")

	return sb.String()
}

func (s *ChatService) GetSessionHistory(sessionID string) (*ChatSessionResponse, error) {
	session, err := s.chatSessionRepo.FindBySessionID(sessionID)
	if err != nil {
		return nil, err
	}

	messages := make([]ChatMessageResponse, len(session.Messages))
	for i, m := range session.Messages {
		messages[i] = ChatMessageResponse{
			Role:      m.Role,
			Content:   m.Content,
			Timestamp: m.Timestamp.Format("2006-01-02T15:04:05Z07:00"),
		}
	}

	return &ChatSessionResponse{
		SessionID: session.SessionID,
		Messages:  messages,
	}, nil
}

func generateSessionID() string {
	return fmt.Sprintf("ses_%d", time.Now().UnixNano())
}

func saveAndDone(respChan chan<- StreamMessage, session *models.ChatSession, fullResponse *strings.Builder, chatSessionRepo *repository.ChatSessionRepository) {
	if fullResponse.Len() > 0 {
		cleanResponse := stripBookingTags(fullResponse.String())
		assistantMsg := models.ChatMessage{
			Role:      "assistant",
			Content:   cleanResponse,
			Timestamp: time.Now(),
		}
		session.Messages = append(session.Messages, assistantMsg)
		chatSessionRepo.Update(session)
	}
	respChan <- StreamMessage{Type: StreamMessageTypeDone, SessionID: session.SessionID}
}

func stripBookingTags(text string) string {
	tags := []struct{ start, end string }{
		{"[BOOKING_CREATE]", "[/BOOKING_CREATE]"},
		{"[BOOKING_QUERY]", "[/BOOKING_QUERY]"},
		{"[BOOKING_CANCEL]", "[/BOOKING_CANCEL]"},
		{"[BOOKING_LIST]", "[/BOOKING_LIST]"},
		{"[BOOKING_INTENT]", "[/BOOKING_INTENT]"},
	}

	result := text
	for _, tag := range tags {
		for {
			startIdx := strings.Index(result, tag.start)
			if startIdx < 0 {
				break
			}
			endIdx := strings.Index(result, tag.end)
			if endIdx < 0 {
				break
			}
			endIdx += len(tag.end)
			result = result[:startIdx] + result[endIdx:]
		}
	}

	result = strings.TrimSpace(result)
	return result
}

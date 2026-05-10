package service

import (
	"context"
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
}

func NewChatService(
	chatSessionRepo *repository.ChatSessionRepository,
	ragService *RAGService,
	configService *ConfigService,
	redisClient *redis.Client,
) *ChatService {
	return &ChatService{
		chatSessionRepo: chatSessionRepo,
		ragService:      ragService,
		configService:   configService,
		redisClient:     redisClient,
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

func (s *ChatService) GetOrCreateSession(sessionID string) (*models.ChatSession, error) {
	if sessionID == "" {
		session := &models.ChatSession{
			SessionID: generateSessionID(),
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

func (s *ChatService) ClearSession(sessionID string) error {
	return s.chatSessionRepo.DeleteBySessionID(sessionID)
}

type StreamMessageType string

const (
	StreamMessageTypeThinking StreamMessageType = "thinking"
	StreamMessageTypeChunk    StreamMessageType = "chunk"
	StreamMessageTypeDone     StreamMessageType = "done"
)

type StreamMessage struct {
	Type      StreamMessageType `json:"type"`
	Content   string            `json:"content,omitempty"`
	SessionID string            `json:"session_id,omitempty"`
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

		systemPrompt := s.buildSystemPrompt(relevantDocs)
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

		for {
			select {
			case <-ctx.Done():
				if fullResponse.Len() > 0 {
					assistantMsg := models.ChatMessage{
						Role:      "assistant",
						Content:   fullResponse.String(),
						Timestamp: time.Now(),
					}
					session.Messages = append(session.Messages, assistantMsg)
					s.chatSessionRepo.Update(session)
					respChan <- StreamMessage{Type: StreamMessageTypeDone, SessionID: session.SessionID}
				}
				return
			default:
				resp, err := stream.Recv()
				if err != nil {
					if fullResponse.Len() > 0 {
						assistantMsg := models.ChatMessage{
							Role:      "assistant",
							Content:   fullResponse.String(),
							Timestamp: time.Now(),
						}
						session.Messages = append(session.Messages, assistantMsg)
						s.chatSessionRepo.Update(session)
					}
					respChan <- StreamMessage{Type: StreamMessageTypeDone, SessionID: session.SessionID}
					return
				}

				if len(resp.Choices) > 0 {
					content := resp.Choices[0].Delta.Content
					if content != "" {
						fullResponse.WriteString(content)
						respChan <- StreamMessage{Type: StreamMessageTypeChunk, Content: content}
					}

					if resp.Choices[0].FinishReason != "" {
						assistantMsg := models.ChatMessage{
							Role:      "assistant",
							Content:   fullResponse.String(),
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

func (s *ChatService) buildSystemPrompt(contexts []string) string {
	sb := &strings.Builder{}
	sb.WriteString("你是一个专业的AI助手，专门回答关于用户个人背景、工作经验、技术栈和项目的问题。\n\n")

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

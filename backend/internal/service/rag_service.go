package service

import (
	"log"
	"mime/multipart"
	"time"

	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"
)

type RAGService struct {
	knowledgeDocRepo *repository.KnowledgeDocRepository
	documentParser   *DocumentParser
	textSplitter     *TextSplitter
	embeddingService *EmbeddingService
}

func NewRAGService(
	knowledgeDocRepo *repository.KnowledgeDocRepository,
	documentParser *DocumentParser,
	textSplitter *TextSplitter,
	embeddingService *EmbeddingService,
) *RAGService {
	return &RAGService{
		knowledgeDocRepo: knowledgeDocRepo,
		documentParser:   documentParser,
		textSplitter:     textSplitter,
		embeddingService: embeddingService,
	}
}

type KnowledgeDocResponse struct {
	ID        uint   `json:"id"`
	Filename  string `json:"filename"`
	CreatedAt string `json:"created_at"`
}

func (s *RAGService) ListDocuments() ([]KnowledgeDocResponse, error) {
	println("[RAGService] 开始查询文档列表")
	docs, err := s.knowledgeDocRepo.FindAll()
	if err != nil {
		println("[RAGService] 查询文档列表失败:", err.Error())
		return nil, err
	}
	println("[RAGService] 找到原始文档数量:", len(docs))

	// 去重：每个文件名只保留一个（最新的）
	seen := make(map[string]bool)
	var uniqueDocs []model.KnowledgeDoc
	for _, doc := range docs {
		if !seen[doc.Filename] {
			seen[doc.Filename] = true
			uniqueDocs = append(uniqueDocs, doc)
		}
	}
	println("[RAGService] 去重后文档数量:", len(uniqueDocs))

	resp := make([]KnowledgeDocResponse, len(uniqueDocs))
	for i, doc := range uniqueDocs {
		println("[RAGService] 文档", i+1, ": ID=", doc.ID, "Filename=", doc.Filename)
		resp[i] = KnowledgeDocResponse{
			ID:        doc.ID,
			Filename:  doc.Filename,
			CreatedAt: doc.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}
	println("[RAGService] 返回文档列表，数量:", len(resp))
	return resp, nil
}

func (s *RAGService) UploadDocument(filename string, file multipart.File) error {
	println("[RAGService] 开始上传文档:", filename)

	content, err := s.documentParser.Parse(filename, file)
	if err != nil {
		println("[RAGService] 解析文档失败:", err.Error())
		return err
	}
	println("[RAGService] 文档内容长度:", len(content))

	chunks := s.textSplitter.Split(content)
	if len(chunks) == 0 {
		// 如果没有分块，至少保存整个文档
		chunks = []string{content}
	}
	println("[RAGService] 分块数量:", len(chunks))

	successCount := 0
	for i, chunk := range chunks {
		embedding, err := s.embeddingService.CreateEmbedding(chunk)
		if err != nil {
			println("[RAGService] 生成 embedding 失败:", err.Error())
			// 即使 embedding 失败，也保存文档（使用零值 1536 维向量，以匹配 PostgreSQL vector(1536) 列类型）
			embedding = make(model.Embedding, 1536)
		}

		doc := &model.KnowledgeDoc{
			Filename:  filename,
			Content:   chunk,
			Embedding: embedding,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		println("[RAGService] 正在保存分块", i+1, "of", len(chunks))
		if err := s.knowledgeDocRepo.Create(doc); err != nil {
			println("[RAGService] 保存分块失败:", err.Error())
			return err
		}
		println("[RAGService] 分块", i+1, "保存成功，ID:", doc.ID)
		successCount++
	}

	println("[RAGService] 上传完成，成功保存", successCount, "个分块")
	return nil
}

func (s *RAGService) DeleteDocument(id uint) error {
	return s.knowledgeDocRepo.Delete(id)
}

func (s *RAGService) ReindexAll() error {
	log.Println("[RAGService] 开始重新索引所有文档")

	// 1. 获取所有文档
	allDocs, err := s.knowledgeDocRepo.FindAll()
	if err != nil {
		log.Printf("[RAGService] 获取文档失败: %v", err)
		return err
	}
	log.Printf("[RAGService] 找到 %d 个文档分块", len(allDocs))

	// 2. 按文件名分组
	docsByFilename := make(map[string][]model.KnowledgeDoc)
	for _, doc := range allDocs {
		docsByFilename[doc.Filename] = append(docsByFilename[doc.Filename], doc)
	}
	log.Printf("[RAGService] 找到 %d 个唯一文档", len(docsByFilename))

	// 3. 清空所有文档
	if err := s.knowledgeDocRepo.DeleteAll(); err != nil {
		log.Printf("[RAGService] 清空文档失败: %v", err)
		return err
	}

	// 4. 重新处理每个文档（合并内容后重新分块和索引）
	for filename, chunks := range docsByFilename {
		log.Printf("[RAGService] 重新索引文档: %s (%d 个分块)", filename, len(chunks))

		// 合并所有分块的内容
		var fullContent string
		for _, chunk := range chunks {
			fullContent += chunk.Content
		}

		// 重新分块
		newChunks := s.textSplitter.Split(fullContent)
		if len(newChunks) == 0 {
			newChunks = []string{fullContent}
		}
		log.Printf("[RAGService]   重新生成 %d 个分块", len(newChunks))

		// 为每个分块生成 embedding 并保存
		for i, chunk := range newChunks {
			embedding, err := s.embeddingService.CreateEmbedding(chunk)
			if err != nil {
				log.Printf("[RAGService]   生成 embedding 失败 (分块 %d): %v", i+1, err)
				embedding = make(model.Embedding, 1536)
			}

			doc := &model.KnowledgeDoc{
				Filename:  filename,
				Content:   chunk,
				Embedding: embedding,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}

			if err := s.knowledgeDocRepo.Create(doc); err != nil {
				log.Printf("[RAGService]   保存分块失败 (分块 %d): %v", i+1, err)
				return err
			}
		}
	}

	log.Println("[RAGService] 重新索引完成")
	return nil
}

func (s *RAGService) RetrieveRelevantDocs(query string, topK int) ([]string, error) {
	log.Printf("[RAGService] 开始检索相关文档，查询: %s", query)

	// 首先检查一下有多少文档
	allDocs, _ := s.knowledgeDocRepo.FindAll()
	log.Printf("[RAGService] 数据库中总共有 %d 个文档分块", len(allDocs))

	embedding, err := s.embeddingService.CreateEmbedding(query)
	if err != nil {
		log.Printf("[RAGService] 创建查询 embedding 失败: %v", err)
		return nil, err
	}
	log.Printf("[RAGService] 成功创建查询 embedding，维度: %d", len(embedding))

	docs, err := s.knowledgeDocRepo.FindSimilarByEmbedding(embedding, topK)
	if err != nil {
		log.Printf("[RAGService] 检索相似文档失败: %v", err)
		return nil, err
	}
	log.Printf("[RAGService] 找到 %d 个相似文档", len(docs))

	result := make([]string, len(docs))
	for i, doc := range docs {
		result[i] = doc.Content
		log.Printf("[RAGService] 文档 %d 内容: %s", i+1, doc.Content)
	}

	return result, nil
}

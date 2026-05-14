package service

import (
	"fmt"
	"log"
	"mime/multipart"
	"sync"
	"time"

	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"

	"github.com/pgvector/pgvector-go"
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
	docs, err := s.knowledgeDocRepo.FindAll()
	if err != nil {
		return nil, err
	}

	seen := make(map[string]bool)
	var resp []KnowledgeDocResponse
	for _, doc := range docs {
		key := doc.DocumentGroup
		if key == "" {
			key = doc.Filename
		}
		if !seen[key] {
			seen[key] = true
			resp = append(resp, KnowledgeDocResponse{
				ID:        doc.ID,
				Filename:  doc.Filename,
				CreatedAt: doc.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			})
		}
	}

	return resp, nil
}

func (s *RAGService) UploadDocument(filename string, file multipart.File) error {
	log.Printf("[RAGService] 开始上传文档: %s", filename)

	content, err := s.documentParser.Parse(filename, file)
	if err != nil {
		log.Printf("[RAGService] 解析文档失败: %v", err)
		return err
	}
	log.Printf("[RAGService] 文档内容长度: %d", len(content))

	chunks := s.textSplitter.Split(content)
	if len(chunks) == 0 {
		chunks = []string{content}
	}
	log.Printf("[RAGService] 分块数量: %d", len(chunks))

	docGroup := generateDocGroupID()

	type chunkResult struct {
		index    int
		embedVec []float32
		content  string
		err      error
	}

	const maxConcurrency = 5
	sem := make(chan struct{}, maxConcurrency)
	var wg sync.WaitGroup
	results := make([]chunkResult, len(chunks))

	for i, chunk := range chunks {
		wg.Add(1)
		go func(idx int, text string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			embeddingVec, err := s.embeddingService.CreateEmbedding(text)
			results[idx] = chunkResult{
				index:    idx,
				embedVec: embeddingVec,
				content:  text,
				err:      err,
			}
		}(i, chunk)
	}
	wg.Wait()

	successCount := 0
	for _, r := range results {
		if r.err != nil {
			log.Printf("[RAGService] 分块 %d embedding 失败: %v", r.index, r.err)
			r.embedVec = make([]float32, 1536)
		}

		doc := &model.KnowledgeDoc{
			Filename:      filename,
			DocumentGroup: docGroup,
			Content:       r.content,
			Embedding:     pgvector.NewVector(r.embedVec),
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		if err := s.knowledgeDocRepo.Create(doc); err != nil {
			log.Printf("[RAGService] 保存分块 %d 失败: %v", r.index, err)
			return err
		}
		successCount++
	}

	log.Printf("[RAGService] 上传完成 document_group=%s 分块数=%d", docGroup, successCount)
	return nil
}

func (s *RAGService) DeleteDocument(id uint) error {
	return s.knowledgeDocRepo.Delete(id)
}

func (s *RAGService) ReindexAll() error {
	log.Println("[RAGService] 开始重新索引所有文档")

	allDocs, err := s.knowledgeDocRepo.FindAll()
	if err != nil {
		log.Printf("[RAGService] 获取文档失败: %v", err)
		return err
	}
	log.Printf("[RAGService] 找到 %d 个文档分块", len(allDocs))

	docsByGroup := make(map[string][]model.KnowledgeDoc)
	for _, doc := range allDocs {
		key := doc.DocumentGroup
		if key == "" {
			key = doc.Filename
		}
		docsByGroup[key] = append(docsByGroup[key], doc)
	}
	log.Printf("[RAGService] 找到 %d 个唯一文档", len(docsByGroup))

	if err := s.knowledgeDocRepo.DeleteAll(); err != nil {
		log.Printf("[RAGService] 清空文档失败: %v", err)
		return err
	}

	for groupKey, chunks := range docsByGroup {
		log.Printf("[RAGService] 重新索引文档: %s (%d 个分块)", groupKey, len(chunks))

		var fullContent string
		for _, chunk := range chunks {
			fullContent += chunk.Content
		}

		newChunks := s.textSplitter.Split(fullContent)
		if len(newChunks) == 0 {
			newChunks = []string{fullContent}
		}
		log.Printf("[RAGService]   重新生成 %d 个分块", len(newChunks))

		docGroup := generateDocGroupID()

		for i, chunk := range newChunks {
			embeddingVec, err := s.embeddingService.CreateEmbedding(chunk)
			if err != nil {
				log.Printf("[RAGService]   生成 embedding 失败 (分块 %d): %v", i+1, err)
				embeddingVec = make([]float32, 1536)
			}

			doc := &model.KnowledgeDoc{
				Filename:      chunks[0].Filename,
				DocumentGroup: docGroup,
				Content:       chunk,
				Embedding:     pgvector.NewVector(embeddingVec),
				CreatedAt:     time.Now(),
				UpdatedAt:     time.Now(),
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

	allDocs, _ := s.knowledgeDocRepo.FindAll()
	log.Printf("[RAGService] 数据库中总共有 %d 个文档分块", len(allDocs))

	embedding, err := s.embeddingService.CreateEmbedding(query)
	if err != nil {
		log.Printf("[RAGService] 创建查询 embedding 失败: %v", err)
		return nil, err
	}

	docs, err := s.knowledgeDocRepo.FindSimilarByEmbeddingDeduped(embedding, topK, true)
	if err != nil {
		log.Printf("[RAGService] 检索相似文档失败: %v", err)
		return nil, err
	}
	log.Printf("[RAGService] 找到 %d 个相似文档（已去重）", len(docs))

	result := make([]string, len(docs))
	for i, doc := range docs {
		result[i] = doc.Content
		log.Printf("[RAGService] 文档 %d (group=%s): %s", i+1, doc.DocumentGroup, doc.Content)
	}

	return result, nil
}

func generateDocGroupID() string {
	return fmt.Sprintf("doc_%d", time.Now().UnixNano())
}

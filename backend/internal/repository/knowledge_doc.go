package repository

import (
	"math"
	"portfolio-backend/internal/model"

	"gorm.io/gorm"
)

type KnowledgeDocRepository struct {
	db *gorm.DB
}

func NewKnowledgeDocRepository(db *gorm.DB) *KnowledgeDocRepository {
	return &KnowledgeDocRepository{db: db}
}

func (r *KnowledgeDocRepository) Create(doc *model.KnowledgeDoc) error {
	return r.db.Create(doc).Error
}

func (r *KnowledgeDocRepository) FindAll() ([]model.KnowledgeDoc, error) {
	var docs []model.KnowledgeDoc
	err := r.db.Order("created_at DESC").Find(&docs).Error
	return docs, err
}

func (r *KnowledgeDocRepository) FindByID(id uint) (*model.KnowledgeDoc, error) {
	var doc model.KnowledgeDoc
	err := r.db.First(&doc, id).Error
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

func (r *KnowledgeDocRepository) Delete(id uint) error {
	// 先找到该ID对应的文件名
	var doc model.KnowledgeDoc
	if err := r.db.First(&doc, id).Error; err != nil {
		return err
	}
	// 删除该文件名的所有分块
	return r.db.Where("filename = ?", doc.Filename).Delete(&model.KnowledgeDoc{}).Error
}

func (r *KnowledgeDocRepository) DeleteAll() error {
	return r.db.Exec("DELETE FROM knowledge_docs").Error
}

func (r *KnowledgeDocRepository) FindSimilarByEmbedding(embedding []float32, topK int) ([]model.KnowledgeDoc, error) {
	var allDocs []model.KnowledgeDoc
	err := r.db.Find(&allDocs).Error
	if err != nil {
		return nil, err
	}

	type docWithScore struct {
		doc   model.KnowledgeDoc
		score float64
	}

	scores := make([]docWithScore, 0, len(allDocs))
	for _, doc := range allDocs {
		if len(doc.Embedding) > 0 {
			score := cosineSimilarity(embedding, doc.Embedding)
			scores = append(scores, docWithScore{doc, score})
		}
	}

	for i := 0; i < len(scores); i++ {
		for j := i + 1; j < len(scores); j++ {
			if scores[i].score < scores[j].score {
				scores[i], scores[j] = scores[j], scores[i]
			}
		}
	}

	result := make([]model.KnowledgeDoc, 0, min(topK, len(scores)))
	for i := 0; i < min(topK, len(scores)); i++ {
		result = append(result, scores[i].doc)
	}

	return result, nil
}

func cosineSimilarity(a, b []float32) float64 {
	if len(a) != len(b) {
		return 0
	}

	var dotProduct, normA, normB float64
	for i := range a {
		dotProduct += float64(a[i] * b[i])
		normA += float64(a[i] * a[i])
		normB += float64(b[i] * b[i])
	}

	if normA == 0 || normB == 0 {
		return 0
	}

	return dotProduct / (math.Sqrt(normA) * math.Sqrt(normB))
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

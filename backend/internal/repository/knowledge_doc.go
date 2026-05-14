package repository

import (
	"math"
	"sort"

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

func (r *KnowledgeDocRepository) FindByDocumentGroup(group string) ([]model.KnowledgeDoc, error) {
	var docs []model.KnowledgeDoc
	err := r.db.Where("document_group = ?", group).Find(&docs).Error
	return docs, err
}

func (r *KnowledgeDocRepository) Delete(id uint) error {
	var doc model.KnowledgeDoc
	if err := r.db.First(&doc, id).Error; err != nil {
		return err
	}

	if doc.DocumentGroup != "" {
		return r.db.Where("document_group = ?", doc.DocumentGroup).Delete(&model.KnowledgeDoc{}).Error
	}

	return r.db.Delete(&model.KnowledgeDoc{}, id).Error
}

func (r *KnowledgeDocRepository) DeleteByDocumentGroup(group string) error {
	return r.db.Where("document_group = ?", group).Delete(&model.KnowledgeDoc{}).Error
}

func (r *KnowledgeDocRepository) DeleteAll() error {
	return r.db.Exec("DELETE FROM knowledge_docs").Error
}

func (r *KnowledgeDocRepository) FindSimilarByEmbedding(embedding []float32, topK int) ([]model.KnowledgeDoc, error) {
	return r.FindSimilarByEmbeddingDeduped(embedding, topK, false)
}

func (r *KnowledgeDocRepository) FindSimilarByEmbeddingDeduped(embedding []float32, topK int, dedupByDocGroup bool) ([]model.KnowledgeDoc, error) {
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
		embSlice := doc.Embedding.Slice()
		if len(embSlice) > 0 {
			score := cosineSimilarity(embedding, embSlice)
			scores = append(scores, docWithScore{doc, score})
		}
	}

	sort.Slice(scores, func(i, j int) bool {
		return scores[i].score > scores[j].score
	})

	if !dedupByDocGroup {
		result := make([]model.KnowledgeDoc, 0, min(topK, len(scores)))
		for i := 0; i < min(topK, len(scores)); i++ {
			result = append(result, scores[i].doc)
		}
		return result, nil
	}

	seenGroups := make(map[string]bool)
	candidateCount := min(topK*3, len(scores))
	result := make([]model.KnowledgeDoc, 0, topK)

	for i := 0; i < candidateCount && len(result) < topK; i++ {
		doc := scores[i].doc
		group := doc.DocumentGroup

		if group != "" {
			if seenGroups[group] {
				continue
			}
			seenGroups[group] = true
		}

		result = append(result, doc)
	}

	for i := candidateCount; i < len(scores) && len(result) < topK; i++ {
		doc := scores[i].doc
		group := doc.DocumentGroup

		if group != "" && seenGroups[group] {
			continue
		}
		result = append(result, doc)
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

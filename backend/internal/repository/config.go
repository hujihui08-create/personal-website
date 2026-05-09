package repository

import (
	"log"
	"portfolio-backend/internal/model"
	"gorm.io/gorm"
)

type ConfigRepository struct {
	db *gorm.DB
}

func NewConfigRepository(db *gorm.DB) *ConfigRepository {
	return &ConfigRepository{db: db}
}

func (r *ConfigRepository) FindAll() ([]model.Config, error) {
	var configs []model.Config
	if err := r.db.Order("category, key").Find(&configs).Error; err != nil {
		return nil, err
	}
	return configs, nil
}

func (r *ConfigRepository) FindByCategory(category string) ([]model.Config, error) {
	var configs []model.Config
	if err := r.db.Where("category = ?", category).Order("key").Find(&configs).Error; err != nil {
		return nil, err
	}
	return configs, nil
}

func (r *ConfigRepository) FindByKey(key string) (*model.Config, error) {
	var config model.Config
	if err := r.db.Where("key = ?", key).First(&config).Error; err != nil {
		return nil, err
	}
	return &config, nil
}

func (r *ConfigRepository) Create(config *model.Config) error {
	return r.db.Create(config).Error
}

func (r *ConfigRepository) Update(key string, value string) error {
	return r.db.Model(&model.Config{}).Where("key = ?", key).Update("value", value).Error
}

func (r *ConfigRepository) Upsert(key string, value string, category string) error {
	log.Printf("[ConfigRepository.Upsert] 开始处理: key=%s, value=%s, category=%s", key, value, category)
	
	var config model.Config
	err := r.db.Where("key = ?", key).First(&config).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Printf("[ConfigRepository.Upsert] 记录不存在，创建新记录")
			err := r.db.Create(&model.Config{
				Key:      key,
				Value:    value,
				Category: category,
			}).Error
			if err != nil {
				log.Printf("[ConfigRepository.Upsert] 创建失败: %v", err)
			} else {
				log.Printf("[ConfigRepository.Upsert] 创建成功")
			}
			return err
		}
		log.Printf("[ConfigRepository.Upsert] 查询失败: %v", err)
		return err
	}
	
	log.Printf("[ConfigRepository.Upsert] 记录已存在，更新值")
	err = r.db.Model(&config).Update("value", value).Error
	if err != nil {
		log.Printf("[ConfigRepository.Upsert] 更新失败: %v", err)
	} else {
		log.Printf("[ConfigRepository.Upsert] 更新成功")
	}
	return err
}

func (r *ConfigRepository) Delete(key string) error {
	return r.db.Where("key = ?", key).Delete(&model.Config{}).Error
}

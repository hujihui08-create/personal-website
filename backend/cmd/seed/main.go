package main

import (
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"os"
	"time"

	"portfolio-backend/internal/config"
	"portfolio-backend/internal/database"
	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"

func generatePassword(length int) (string, error) {
	if length < 8 {
		length = 12
	}
	password := make([]byte, length)
	for i := 0; i < length; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		password[i] = charset[n.Int64()]
	}
	return string(password), nil
}

func hashPassword(password string) (string, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedBytes), nil
}

func main() {
	fmt.Println("========================================")
	fmt.Println("    数据库种子数据初始化工具")
	fmt.Println("========================================")

	cfg := config.Load()

	fmt.Println("\n[1/8] 正在连接数据库...")
	db, err := database.Connect(cfg.Database)
	if err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}
	fmt.Println("  ✓ 数据库连接成功")

	fmt.Println("\n[2/8] 正在创建数据库表...")
	if err := autoMigrateAll(db); err != nil {
		log.Fatalf("创建数据库表失败: %v", err)
	}
	fmt.Println("  ✓ 数据库表创建/更新成功")

	fmt.Println("\n[3/8] 正在初始化管理员账号...")
	seedAdmin(db)

	fmt.Println("\n[4/8] 正在初始化个人简介...")
	seedProfile(db)

	fmt.Println("\n[5/8] 正在初始化项目数据...")
	seedProjects(db)

	fmt.Println("\n[6/8] 正在初始化工作经验...")
	seedWorkExperiences(db)

	fmt.Println("\n[7/8] 正在初始化预约时段...")
	seedScheduleSettings(db)

	fmt.Println("\n[8/8] 正在初始化默认配置和Agent提示词...")
	seedConfigs(db)
	seedAgentPrompts(db)

	fmt.Println("\n========================================")
	fmt.Println("    所有种子数据初始化完成！")
	fmt.Println("========================================")
}

func autoMigrateAll(db *gorm.DB) error {
	if err := db.Exec("CREATE EXTENSION IF NOT EXISTS vector").Error; err != nil {
		return fmt.Errorf("创建vector扩展失败: %w", err)
	}

	return db.AutoMigrate(
		&model.Admin{},
		&model.Project{},
		&model.Profile{},
		&model.WorkExperience{},
		&model.ExperienceProject{},
		&model.Resume{},
		&model.ScheduleSetting{},
		&model.Booking{},
		&model.Notification{},
		&model.ChatSession{},
		&model.Config{},
		&model.KnowledgeDoc{},
		&model.AgentDebugLog{},
		&model.AgentPrompt{},
	)
}

func seedAdmin(db *gorm.DB) {
	customPassword := os.Getenv("ADMIN_PASSWORD")

	var count int64
	db.Model(&model.Admin{}).Count(&count)

	if count > 0 {
		if customPassword != "" {
			fmt.Println("  ⓘ 管理员已存在，使用自定义密码重置...")
			passwordHash, err := hashPassword(customPassword)
			if err != nil {
				log.Printf("  ✗ 加密密码失败: %v", err)
				return
			}
			if err := db.Model(&model.Admin{}).Where("id = 1").Update("password_hash", passwordHash).Error; err != nil {
				log.Printf("  ✗ 重置密码失败: %v", err)
				return
			}
			fmt.Printf("  ✓ 管理员密码已重置为: %s\n", customPassword)
			return
		}
		fmt.Println("  ⓘ 管理员已存在，跳过创建")
		return
	}

	var password string
	var err error
	if customPassword != "" {
		password = customPassword
		fmt.Println("  ⓘ 使用自定义管理员密码")
	} else {
		password, err = generatePassword(12)
		if err != nil {
			log.Printf("  ✗ 生成密码失败: %v", err)
			return
		}
	}

	passwordHash, err := hashPassword(password)
	if err != nil {
		log.Printf("  ✗ 加密密码失败: %v", err)
		return
	}

	admin := &model.Admin{
		PasswordHash: passwordHash,
	}
	if err := db.Create(admin).Error; err != nil {
		log.Printf("  ✗ 创建管理员失败: %v", err)
		return
	}

	fmt.Printf("  ✓ 管理员创建成功 (ID: %d)\n", admin.ID)
	fmt.Printf("  ⚠ 管理员密码: %s (请妥善保管，建议登录后修改)\n", password)
}

func seedProfile(db *gorm.DB) {
	var count int64
	db.Model(&model.Profile{}).Count(&count)
	if count > 0 {
		fmt.Println("  ⓘ 个人简介已存在，跳过创建")
		return
	}

	profile := model.Profile{
		Name:        "张三",
		Title:       "全栈开发工程师",
		Bio:         "热爱技术的全栈开发者，专注于 Web 开发和人工智能应用。拥有丰富的项目经验，擅长 React、Go 和云原生技术栈。",
		AvatarURL:   "",
		GithubURL:   "https://github.com/yourusername",
		LinkedinURL: "https://linkedin.com/in/yourusername",
		Email:       "your-email@example.com",
		Skills:      []string{"React", "TypeScript", "Go", "PostgreSQL", "Docker", "Kubernetes", "Python", "AI/LLM"},
	}

	if err := db.Create(&profile).Error; err != nil {
		log.Printf("  ✗ 创建个人简介失败: %v", err)
		return
	}

	fmt.Println("  ✓ 个人简介创建成功")
}

func seedProjects(db *gorm.DB) {
	var count int64
	db.Model(&model.Project{}).Count(&count)
	if count > 0 {
		fmt.Println("  ⓘ 项目数据已存在，跳过创建")
		return
	}

	now := time.Now()
	may2025 := time.Date(2025, 5, 1, 0, 0, 0, 0, time.UTC)
	sep2025 := time.Date(2025, 9, 1, 0, 0, 0, 0, time.UTC)
	dec2025 := time.Date(2025, 12, 31, 0, 0, 0, 0, time.UTC)
	mar2026 := time.Date(2026, 3, 1, 0, 0, 0, 0, time.UTC)

	projects := []model.Project{
		{
			Name:        "个人网站",
			Type:        "personal",
			StartDate:   &may2025,
			EndDate:     &now,
			Summary:     "基于 React + Go 的全栈个人网站，展示个人作品、AI 助手和预约功能。",
			Description: "采用前后端分离架构，前端使用 React + TypeScript + Tailwind CSS，后端使用 Go + Gin + GORM。集成 AI 对话助手、文件管理、预约系统等功能。",
			CoverImage:  "",
			Images:      []string{},
			GitHubURL:   "https://github.com/yourusername/portfolio",
			DemoURL:     "https://your-domain.com",
			Tags:        []string{"React", "TypeScript", "Go", "PostgreSQL", "Tailwind CSS"},
			SortOrder:   1,
		},
		{
			Name:        "企业内部管理系统",
			Type:        "enterprise",
			StartDate:   &sep2025,
			EndDate:     &dec2025,
			Summary:     "为某大型企业开发的内容管理和工作流自动化平台。",
			Description: "基于微服务架构的企业级应用，包含用户权限管理、内容发布审批流程、数据分析看板等核心模块。",
			CoverImage:  "",
			Images:      []string{},
			GitHubURL:   "",
			DemoURL:     "",
			Tags:        []string{"React", "Go", "Microservices", "Docker", "Kubernetes"},
			SortOrder:   2,
		},
		{
			Name:        "AI 智能客服系统",
			Type:        "personal",
			StartDate:   &mar2026,
			EndDate:     &now,
			Summary:     "基于大语言模型的智能客服系统，支持多渠道接入和自定义知识库。",
			Description: "集成 RAG（检索增强生成）技术，支持 PDF、Word 等文档的向量化索引。提供 WebSocket 实时对话和流式输出。",
			CoverImage:  "",
			Images:      []string{},
			GitHubURL:   "https://github.com/yourusername/ai-customer-service",
			DemoURL:     "",
			Tags:        []string{"AI", "LLM", "RAG", "WebSocket", "Go", "Python"},
			SortOrder:   3,
		},
	}

	for i := range projects {
		if err := db.Create(&projects[i]).Error; err != nil {
			log.Printf("  ✗ 创建项目「%s」失败: %v", projects[i].Name, err)
			continue
		}
		fmt.Printf("  ✓ 项目「%s」创建成功\n", projects[i].Name)
	}
}

func seedWorkExperiences(db *gorm.DB) {
	var count int64
	db.Model(&model.WorkExperience{}).Count(&count)
	if count > 0 {
		fmt.Println("  ⓘ 工作经验已存在，跳过创建")
		return
	}

	now := time.Now()
	sep2022 := time.Date(2022, 9, 1, 0, 0, 0, 0, time.UTC)
	jul2024 := time.Date(2024, 7, 31, 0, 0, 0, 0, time.UTC)
	aug2024 := time.Date(2024, 8, 15, 0, 0, 0, 0, time.UTC)

	experiences := []model.WorkExperience{
		{
			Type:        "work",
			CompanyName: "某科技有限公司",
			Position:    "高级前端开发工程师",
			StartDate:   sep2022,
			EndDate:     &jul2024,
			Description: "负责公司核心产品的前端架构设计和技术选型；主导了微前端架构的落地实施，提升了多团队协作效率；开发了内部组件库，统一了公司级 UI 规范。",
			SortOrder:   1,
		},
		{
			Type:        "work",
			CompanyName: "某互联网公司",
			Position:    "全栈开发工程师",
			StartDate:   aug2024,
			EndDate:     &now,
			Description: "负责中后台管理系统的全栈开发，使用 React + Go 技术栈；参与 AI 客服系统的架构设计和核心功能开发；采用 TDD 开发模式，保证代码质量和可维护性。",
			SortOrder:   2,
		},
	}

	for i := range experiences {
		if err := db.Create(&experiences[i]).Error; err != nil {
			log.Printf("  ✗ 创建工作经验「%s」失败: %v", experiences[i].CompanyName, err)
			continue
		}
		fmt.Printf("  ✓ 工作经验「%s」创建成功\n", experiences[i].CompanyName)
	}
}

func seedScheduleSettings(db *gorm.DB) {
	var count int64
	db.Model(&model.ScheduleSetting{}).Count(&count)
	if count > 0 {
		fmt.Println("  ⓘ 预约时段已存在，跳过创建")
		return
	}

	settings := []model.ScheduleSetting{
		{Weekday: 1, StartTime: "09:00", EndTime: "10:00", IsActive: true},
		{Weekday: 1, StartTime: "10:00", EndTime: "11:00", IsActive: true},
		{Weekday: 1, StartTime: "11:00", EndTime: "12:00", IsActive: true},
		{Weekday: 1, StartTime: "14:00", EndTime: "15:00", IsActive: true},
		{Weekday: 1, StartTime: "15:00", EndTime: "16:00", IsActive: true},
		{Weekday: 2, StartTime: "09:00", EndTime: "10:00", IsActive: true},
		{Weekday: 2, StartTime: "10:00", EndTime: "11:00", IsActive: true},
		{Weekday: 2, StartTime: "14:00", EndTime: "15:00", IsActive: true},
		{Weekday: 2, StartTime: "15:00", EndTime: "16:00", IsActive: true},
		{Weekday: 2, StartTime: "16:00", EndTime: "17:00", IsActive: true},
		{Weekday: 3, StartTime: "09:00", EndTime: "10:00", IsActive: true},
		{Weekday: 3, StartTime: "10:00", EndTime: "11:00", IsActive: true},
		{Weekday: 3, StartTime: "11:00", EndTime: "12:00", IsActive: true},
		{Weekday: 3, StartTime: "14:00", EndTime: "15:00", IsActive: true},
		{Weekday: 3, StartTime: "15:00", EndTime: "16:00", IsActive: true},
		{Weekday: 4, StartTime: "09:00", EndTime: "10:00", IsActive: true},
		{Weekday: 4, StartTime: "10:00", EndTime: "11:00", IsActive: true},
		{Weekday: 4, StartTime: "14:00", EndTime: "15:00", IsActive: true},
		{Weekday: 4, StartTime: "15:00", EndTime: "16:00", IsActive: true},
		{Weekday: 5, StartTime: "09:00", EndTime: "10:00", IsActive: true},
		{Weekday: 5, StartTime: "10:00", EndTime: "11:00", IsActive: true},
		{Weekday: 5, StartTime: "14:00", EndTime: "15:00", IsActive: true},
		{Weekday: 5, StartTime: "15:00", EndTime: "16:00", IsActive: true},
		{Weekday: 5, StartTime: "16:00", EndTime: "17:00", IsActive: true},
	}

	insertCount := 0
	for _, setting := range settings {
		if err := db.Create(&setting).Error; err != nil {
			log.Printf("  ✗ 插入时段失败 (周%d %s-%s): %v", setting.Weekday, setting.StartTime, setting.EndTime, err)
			continue
		}
		insertCount++
	}

	fmt.Printf("  ✓ 成功创建 %d 条预约时段\n", insertCount)
}

func seedConfigs(db *gorm.DB) {
	configRepo := repository.NewConfigRepository(db)

	getEnv := func(key string) string {
		v, exists := os.LookupEnv(key)
		if exists {
			return v
		}
		return ""
	}

	defaultConfigs := []struct {
		key      string
		value    string
		envVar   string
		category string
	}{
		{"llm.provider", "openai", "LLM_PROVIDER", "llm"},
		{"llm.api_key", "", "LLM_API_KEY", "llm"},
		{"llm.base_url", "", "LLM_BASE_URL", "llm"},
		{"llm.model", "deepseek-chat", "LLM_MODEL", "llm"},
		{"llm.temperature", "0.7", "LLM_TEMPERATURE", "llm"},
		{"llm.max_tokens", "2000", "LLM_MAX_TOKENS", "llm"},
		{"embedding.provider", "openai", "LLM_PROVIDER", "embedding"},
		{"embedding.api_key", "", "LLM_API_KEY", "embedding"},
		{"embedding.base_url", "", "LLM_BASE_URL", "embedding"},
		{"embedding.model", "text-embedding-3-small", "LLM_EMBEDDING_MODEL", "embedding"},
	}

	for _, cfg := range defaultConfigs {
		existing, err := configRepo.FindByKey(cfg.key)
		if err == nil && existing != nil && existing.Value != "" {
			continue
		}

		value := getEnv(cfg.envVar)
		if value == "" {
			value = cfg.value
		}

		if err := configRepo.Upsert(cfg.key, value, cfg.category); err != nil {
			log.Printf("  ✗ 配置 %s 初始化失败: %v", cfg.key, err)
		}
	}

	fmt.Println("  ✓ 默认配置初始化完成")
}

func seedAgentPrompts(db *gorm.DB) {
	var count int64
	db.Model(&model.AgentPrompt{}).Count(&count)
	if count > 0 {
		fmt.Println("  ⓘ Agent提示词已存在，跳过创建")
		return
	}

	prompts := []model.AgentPrompt{
		{
			AgentType: "chat",
			Name:      "默认对话助手",
			SystemPrompt: `你是一个专业的个人网站AI助手。你的职责包括：
1. 友好地回答访客关于网站主人的问题
2. 介绍网站主人的技能、项目经验和工作经历
3. 帮助访客了解如何预约咨询
4. 解答常见技术问题

请保持专业、友好的语气，用中文回答。如果遇到不知道的问题，请礼貌地表示无法回答。`,
			ContextTemplate: `以下是关于网站主人的信息，你可以作为参考：
- 姓名: {{.Profile.Name}}
- 职位: {{.Profile.Title}}
- 技能: {{.Profile.Skills}}
- 简介: {{.Profile.Bio}}

工作经验:
{{range .Experiences}}
- {{.CompanyName}} - {{.Position}} ({{.StartDate}} 至 {{if .EndDate}}{{.EndDate}}{{else}}至今{{end}})
{{end}}

项目经历:
{{range .Projects}}
- {{.Name}}: {{.Summary}}
{{end}}`,
			IsDefault: true,
			IsActive:  true,
		},
		{
			AgentType: "booking",
			Name:      "预约引导助手 - 创建/查询/取消",
			SystemPrompt: `你是一个预约助手，能够帮助用户完成预约的创建、查询和取消操作。

## 创建预约
当用户表示想要预约时，请逐步收集以下信息：
- 公司名称
- 公司地点
- 联系人姓名
- 联系电话（11位手机号）
- 联系邮箱
- 预约日期（格式：YYYY-MM-DD，仅限工作日周一至周五）
- 预约时段（格式：HH:MM，如 09:00）
- 备注（可选）

收集完所有必要信息后，在你的回复末尾添加以下结构化标记来执行预约：

[BOOKING_CREATE]
{"company_name":"用户提供的公司名","company_location":"地点","contact_name":"联系人","contact_phone":"手机号","contact_email":"邮箱","booking_date":"日期","booking_time":"时段","notes":"备注或空字符串"}
[/BOOKING_CREATE]

注意：
- 所有字段值必须来自用户提供的信息，不要编造
- 标记必须放在回复的最末尾
- 日期格式必须是 YYYY-MM-DD
- 时段格式必须是 HH:MM

## 查询预约
当用户想要查询预约时，收集预约编号和手机号，然后输出：

[BOOKING_QUERY]
{"id":预约编号,"phone":"手机号"}
[/BOOKING_QUERY]

## 取消预约
当用户想要取消预约时，收集预约编号和手机号，确认后输出：

[BOOKING_CANCEL]
{"id":预约编号,"phone":"手机号"}
[/BOOKING_CANCEL]

请保持友好、耐心的语气，用中文回答。`,
			IsDefault: true,
			IsActive:  true,
		},
	}

	for i := range prompts {
		if err := db.Create(&prompts[i]).Error; err != nil {
			log.Printf("  ✗ 创建Agent提示词「%s」失败: %v", prompts[i].Name, err)
			continue
		}
		fmt.Printf("  ✓ Agent提示词「%s」创建成功\n", prompts[i].Name)
	}
}

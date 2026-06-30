package model

type AgentTool struct {
	ID             uint   `gorm:"primaryKey" json:"id"`
	Name           string `gorm:"unique;not null;size:50" json:"name"`
	Description    string `gorm:"not null" json:"description"`
	ParametersJSON string `gorm:"column:parameters_json;type:jsonb;not null" json:"parameters_json"`
	HandlerType    string `gorm:"column:handler_type;size:50;not null" json:"handler_type"`
	IsActive       bool   `gorm:"column:is_active;default:true" json:"is_active"`
}

func (AgentTool) TableName() string {
	return "agent_tools"
}

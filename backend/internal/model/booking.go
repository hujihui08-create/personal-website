package model

import "time"

type ScheduleSetting struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Weekday   int       `gorm:"column:weekday;not null;check:weekday between 1 and 5" json:"weekday"`
	StartTime string    `gorm:"column:start_time;not null" json:"start_time"`
	EndTime   string    `gorm:"column:end_time;not null" json:"end_time"`
	IsActive  bool      `gorm:"column:is_active;default:true" json:"is_active"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (ScheduleSetting) TableName() string {
	return "schedule_settings"
}

type Booking struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	CompanyName     string    `gorm:"column:company_name;not null;size:100" json:"company_name"`
	CompanyLocation string    `gorm:"column:company_location;not null;size:100" json:"company_location"`
	BookingDate     string    `gorm:"column:booking_date;not null;index" json:"booking_date"`
	BookingTime     string    `gorm:"column:booking_time;not null" json:"booking_time"`
	ContactName     string    `gorm:"column:contact_name;not null;size:50" json:"contact_name"`
	ContactEmail    string    `gorm:"column:contact_email;not null;size:255" json:"contact_email"`
	ContactPhone    string    `gorm:"column:contact_phone;not null;size:20" json:"contact_phone"`
	Notes           string    `gorm:"column:notes;type:text" json:"notes,omitempty"`
	Status          string    `gorm:"column:status;default:pending;check:status in ('pending','confirmed','rejected','completed','cancelled')" json:"status"`
	RejectReason    string    `gorm:"column:reject_reason;type:text" json:"reject_reason,omitempty"`
	CreatedAt       time.Time `gorm:"column:created_at;index:idx_bookings_created_at" json:"created_at"`
	UpdatedAt       time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (Booking) TableName() string {
	return "bookings"
}

type BookingResponse struct {
	ID              uint      `json:"id"`
	CompanyName     string    `json:"company_name"`
	CompanyLocation string    `json:"company_location"`
	BookingDate     string    `json:"booking_date"`
	BookingTime     string    `json:"booking_time"`
	ContactName     string    `json:"contact_name"`
	ContactEmail    string    `json:"contact_email"`
	ContactPhone    string    `json:"contact_phone"`
	Notes           string    `json:"notes,omitempty"`
	Status          string    `json:"status"`
	RejectReason    string    `json:"reject_reason,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

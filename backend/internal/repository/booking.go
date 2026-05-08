package repository

import (
	"portfolio-backend/internal/model"
	"gorm.io/gorm"
)

type ScheduleSettingRepository struct {
	db *gorm.DB
}

func NewScheduleSettingRepository(db *gorm.DB) *ScheduleSettingRepository {
	return &ScheduleSettingRepository{db: db}
}

func (r *ScheduleSettingRepository) FindAll() ([]model.ScheduleSetting, error) {
	var settings []model.ScheduleSetting
	if err := r.db.Find(&settings).Error; err != nil {
		return nil, err
	}
	return settings, nil
}

func (r *ScheduleSettingRepository) FindActiveByWeekday(weekday int) ([]model.ScheduleSetting, error) {
	var settings []model.ScheduleSetting
	if err := r.db.Where("weekday = ? AND is_active = ?", weekday, true).Find(&settings).Error; err != nil {
		return nil, err
	}
	return settings, nil
}

func (r *ScheduleSettingRepository) Create(setting *model.ScheduleSetting) error {
	return r.db.Create(setting).Error
}

func (r *ScheduleSettingRepository) Update(setting *model.ScheduleSetting) error {
	return r.db.Save(setting).Error
}

func (r *ScheduleSettingRepository) Delete(id uint) error {
	return r.db.Delete(&model.ScheduleSetting{}, id).Error
}

func (r *ScheduleSettingRepository) DeleteAll() error {
	return r.db.Exec("DELETE FROM schedule_settings").Error
}

type BookingRepository struct {
	db *gorm.DB
}

func NewBookingRepository(db *gorm.DB) *BookingRepository {
	return &BookingRepository{db: db}
}

func (r *BookingRepository) Create(booking *model.Booking) error {
	return r.db.Create(booking).Error
}

func (r *BookingRepository) FindByID(id uint) (*model.Booking, error) {
	var booking model.Booking
	if err := r.db.First(&booking, id).Error; err != nil {
		return nil, err
	}
	return &booking, nil
}

func (r *BookingRepository) FindByDate(bookingDate string) ([]model.Booking, error) {
	var bookings []model.Booking
	if err := r.db.Where("booking_date = ?", bookingDate).Find(&bookings).Error; err != nil {
		return nil, err
	}
	return bookings, nil
}

func (r *BookingRepository) FindByDateAndTime(bookingDate, bookingTime string) (*model.Booking, error) {
	var booking model.Booking
	if err := r.db.Where("booking_date = ? AND booking_time = ?", bookingDate, bookingTime).First(&booking).Error; err != nil {
		return nil, err
	}
	return &booking, nil
}

func (r *BookingRepository) List(page, pageSize int, status string, search string) ([]model.Booking, int64, error) {
	var bookings []model.Booking
	var total int64

	query := r.db.Model(&model.Booking{})

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if search != "" {
		query = query.Where("company_name LIKE ?", "%"+search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&bookings).Error; err != nil {
		return nil, 0, err
	}

	return bookings, total, nil
}

func (r *BookingRepository) Update(booking *model.Booking) error {
	return r.db.Save(booking).Error
}

func (r *BookingRepository) UpdateStatus(id uint, status string, rejectReason string) error {
	updates := map[string]interface{}{
		"status": status,
	}
	if rejectReason != "" {
		updates["reject_reason"] = rejectReason
	}
	return r.db.Model(&model.Booking{}).Where("id = ?", id).Updates(updates).Error
}

func (r *BookingRepository) Delete(id uint) error {
	return r.db.Delete(&model.Booking{}, id).Error
}

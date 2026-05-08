package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"portfolio-backend/internal/database"
	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"
)

var (
	ErrSlotUnavailable    = errors.New("该时段已被预约")
	ErrRateLimitIP        = errors.New("请求过于频繁，请稍后再试")
	ErrRateLimitEmail     = errors.New("该邮箱今日预约次数已达上限")
	ErrNotWeekday         = errors.New("仅支持工作日预约")
	ErrInvalidBookingTime = errors.New("无效的预约时间")
)

type BookingService struct {
	scheduleSettingRepo *repository.ScheduleSettingRepository
	bookingRepo         *repository.BookingRepository
	notificationService *NotificationService
}

func NewBookingService(
	scheduleSettingRepo *repository.ScheduleSettingRepository,
	bookingRepo *repository.BookingRepository,
	notificationService *NotificationService,
) *BookingService {
	return &BookingService{
		scheduleSettingRepo: scheduleSettingRepo,
		bookingRepo:         bookingRepo,
		notificationService: notificationService,
	}
}

type Slot struct {
	Time      string `json:"time"`
	Available bool   `json:"available"`
	Reason    string `json:"reason,omitempty"`
}

type SlotsResponse struct {
	Date        string `json:"date"`
	Weekday     string `json:"weekday"`
	IsAvailable bool   `json:"is_available"`
	Message     string `json:"message,omitempty"`
	Slots       []Slot `json:"slots,omitempty"`
}

func (s *BookingService) GetAvailableSlots(date string) (*SlotsResponse, error) {
	ctx := context.Background()
	cacheKey := fmt.Sprintf("booking:slots:%s", date)

	var cached SlotsResponse
	err := database.RedisClient.Get(ctx, cacheKey).Scan(&cached)
	if err == nil {
		return &cached, nil
	}

	parsedDate, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, err
	}

	weekday := int(parsedDate.Weekday())
	if weekday == 0 || weekday == 6 {
		response := &SlotsResponse{
			Date:        date,
			Weekday:     getWeekdayName(weekday),
			IsAvailable: false,
			Message:     "仅支持工作日预约",
		}
		database.RedisClient.Set(ctx, cacheKey, response, 5*time.Minute)
		return response, nil
	}

	settings, err := s.scheduleSettingRepo.FindActiveByWeekday(weekday)
	if err != nil {
		return nil, err
	}

	bookings, err := s.bookingRepo.FindByDate(date)
	if err != nil {
		return nil, err
	}

	bookedTimes := make(map[string]bool)
	for _, booking := range bookings {
		if booking.Status != "cancelled" {
			bookedTimes[booking.BookingTime] = true
		}
	}

	var slots []Slot
	for _, setting := range settings {
		available := !bookedTimes[setting.StartTime]
		reason := ""
		if !available {
			reason = "已预约"
		}
		slots = append(slots, Slot{
			Time:      setting.StartTime,
			Available: available,
			Reason:    reason,
		})
	}

	response := &SlotsResponse{
		Date:        date,
		Weekday:     getWeekdayName(weekday),
		IsAvailable: true,
		Slots:       slots,
	}

	database.RedisClient.Set(ctx, cacheKey, response, 5*time.Minute)
	return response, nil
}

func (s *BookingService) CreateBooking(
	companyName string,
	companyLocation string,
	bookingDate string,
	bookingTime string,
	contactName string,
	contactEmail string,
	contactPhone string,
	notes string,
	ip string,
) (*model.BookingResponse, error) {
	ctx := context.Background()

	ipKey := fmt.Sprintf("booking:ip:%s", ip)
	ipCount, _ := database.RedisClient.Get(ctx, ipKey).Int()
	if ipCount >= 5 {
		return nil, ErrRateLimitIP
	}

	today := time.Now().Format("2006-01-02")
	emailKey := fmt.Sprintf("booking:email:%s:%s", contactEmail, today)
	emailCount, _ := database.RedisClient.Get(ctx, emailKey).Int()
	if emailCount >= 3 {
		return nil, ErrRateLimitEmail
	}

	parsedDate, err := time.Parse("2006-01-02", bookingDate)
	if err != nil {
		return nil, ErrInvalidBookingTime
	}

	weekday := int(parsedDate.Weekday())
	if weekday == 0 || weekday == 6 {
		return nil, ErrNotWeekday
	}

	existingBooking, _ := s.bookingRepo.FindByDateAndTime(bookingDate, bookingTime)
	if existingBooking != nil && existingBooking.Status != "cancelled" {
		return nil, ErrSlotUnavailable
	}

	booking := &model.Booking{
		CompanyName:     companyName,
		CompanyLocation: companyLocation,
		BookingDate:     bookingDate,
		BookingTime:     bookingTime,
		ContactName:     contactName,
		ContactEmail:    contactEmail,
		ContactPhone:    contactPhone,
		Notes:           notes,
		Status:          "pending",
	}

	if err := s.bookingRepo.Create(booking); err != nil {
		return nil, err
	}

	database.RedisClient.Incr(ctx, ipKey)
	database.RedisClient.Expire(ctx, ipKey, 1*time.Hour)

	database.RedisClient.Incr(ctx, emailKey)
	database.RedisClient.Expire(ctx, emailKey, 24*time.Hour)

	cacheKey := fmt.Sprintf("booking:slots:%s", bookingDate)
	database.RedisClient.Del(ctx, cacheKey)

	if s.notificationService != nil {
		_ = s.notificationService.NotifyNewBooking(booking)
	}

	return toBookingResponse(booking), nil
}

func (s *BookingService) ListBookings(page, pageSize int, status string, search string) ([]model.BookingResponse, int64, error) {
	bookings, total, err := s.bookingRepo.List(page, pageSize, status, search)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]model.BookingResponse, len(bookings))
	for i, booking := range bookings {
		responses[i] = *toBookingResponse(&booking)
	}

	return responses, total, nil
}

func (s *BookingService) GetBooking(id uint) (*model.BookingResponse, error) {
	booking, err := s.bookingRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	return toBookingResponse(booking), nil
}

func (s *BookingService) UpdateBookingStatus(id uint, status string, rejectReason string) (*model.BookingResponse, error) {
	booking, err := s.bookingRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if err := s.bookingRepo.UpdateStatus(id, status, rejectReason); err != nil {
		return nil, err
	}

	booking.Status = status
	booking.RejectReason = rejectReason

	cacheKey := fmt.Sprintf("booking:slots:%s", booking.BookingDate)
	database.RedisClient.Del(context.Background(), cacheKey)

	if s.notificationService != nil {
		_ = s.notificationService.NotifyBookingStatusChanged(booking, status)
	}

	return toBookingResponse(booking), nil
}

func (s *BookingService) GetScheduleSettings() ([]model.ScheduleSetting, error) {
	return s.scheduleSettingRepo.FindAll()
}

func (s *BookingService) UpdateScheduleSettings(settings []model.ScheduleSetting) error {
	if err := s.scheduleSettingRepo.DeleteAll(); err != nil {
		return err
	}

	for _, setting := range settings {
		if err := s.scheduleSettingRepo.Create(&setting); err != nil {
			return err
		}
	}

	database.RedisClient.Del(context.Background(), "booking:slots:*")

	return nil
}

func getWeekdayName(weekday int) string {
	names := []string{"周日", "周一", "周二", "周三", "周四", "周五", "周六"}
	if weekday >= 0 && weekday < len(names) {
		return names[weekday]
	}
	return ""
}

func toBookingResponse(booking *model.Booking) *model.BookingResponse {
	return &model.BookingResponse{
		ID:              booking.ID,
		CompanyName:     booking.CompanyName,
		CompanyLocation: booking.CompanyLocation,
		BookingDate:     booking.BookingDate,
		BookingTime:     booking.BookingTime,
		ContactName:     booking.ContactName,
		ContactEmail:    booking.ContactEmail,
		ContactPhone:    booking.ContactPhone,
		Notes:           booking.Notes,
		Status:          booking.Status,
		RejectReason:    booking.RejectReason,
		CreatedAt:       booking.CreatedAt,
		UpdatedAt:       booking.UpdatedAt,
	}
}

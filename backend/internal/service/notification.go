package service

import (
	"fmt"
	"portfolio-backend/internal/model"
	"portfolio-backend/internal/repository"
)

type NotificationService struct {
	notificationRepo *repository.NotificationRepository
	emailService     *EmailService
}

func NewNotificationService(notificationRepo *repository.NotificationRepository, emailService *EmailService) *NotificationService {
	return &NotificationService{
		notificationRepo: notificationRepo,
		emailService:     emailService,
	}
}

func (s *NotificationService) CreateNotification(notificationType, title, content string, relatedID *uint) (*model.Notification, error) {
	notification := &model.Notification{
		Type:      notificationType,
		Title:     title,
		Content:   content,
		IsRead:    false,
		RelatedID: relatedID,
	}

	err := s.notificationRepo.Create(notification)
	if err != nil {
		return nil, err
	}

	return notification, nil
}

func (s *NotificationService) GetNotifications(page, pageSize int) ([]model.Notification, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	return s.notificationRepo.List(page, pageSize)
}

func (s *NotificationService) MarkAsRead(id uint) error {
	return s.notificationRepo.MarkAsRead(id)
}

func (s *NotificationService) MarkAllAsRead() error {
	return s.notificationRepo.MarkAllAsRead()
}

func (s *NotificationService) GetUnreadCount() (int64, error) {
	return s.notificationRepo.CountUnread()
}

func (s *NotificationService) NotifyNewBooking(booking *model.Booking) error {
	title := "新面试预约"
	content := fmt.Sprintf("%s 预约了面试，时间：%s %s，请及时处理。",
		booking.CompanyName, booking.BookingDate, booking.BookingTime)
	relatedID := uint(booking.ID)

	_, err := s.CreateNotification("new_booking", title, content, &relatedID)
	if err != nil {
		return err
	}

	if s.emailService != nil {
		go func() {
			_ = s.emailService.SendNewBookingNotification(
				booking.CompanyName,
				booking.CompanyLocation,
				booking.BookingDate,
				booking.BookingTime,
				booking.ContactEmail,
				booking.ContactPhone,
				booking.Notes,
			)
		}()
	}

	return nil
}

func (s *NotificationService) NotifyBookingStatusChanged(booking *model.Booking, status string) error {
	var title, content string
	relatedID := uint(booking.ID)

	switch status {
	case "confirmed":
		title = "预约已确认"
		content = fmt.Sprintf("%s 的面试预约已确认，时间：%s %s。",
			booking.CompanyName, booking.BookingDate, booking.BookingTime)
	case "rejected":
		title = "预约已拒绝"
		content = fmt.Sprintf("%s 的面试预约已拒绝。", booking.CompanyName)
	default:
		return nil
	}

	_, err := s.CreateNotification(status, title, content, &relatedID)
	if err != nil {
		return err
	}

	if s.emailService != nil {
		go func() {
			if status == "confirmed" {
				_ = s.emailService.SendBookingConfirmedNotification(
					booking.CompanyName,
					booking.BookingDate,
					booking.BookingTime,
					booking.ContactEmail,
				)
			} else if status == "rejected" {
				_ = s.emailService.SendBookingRejectedNotification(
					booking.CompanyName,
					booking.ContactEmail,
					booking.RejectReason,
				)
			}
		}()
	}

	return nil
}

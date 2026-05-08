package handler

import (
	"errors"
	"net/http"
	"strconv"

	"portfolio-backend/internal/model"
	"portfolio-backend/internal/service"
	"github.com/gin-gonic/gin"
)

type BookingHandler struct {
	bookingService *service.BookingService
}

func NewBookingHandler(bookingService *service.BookingService) *BookingHandler {
	return &BookingHandler{bookingService: bookingService}
}

type CreateBookingRequest struct {
	CompanyName     string `json:"company_name" binding:"required,min=2,max=100"`
	CompanyLocation string `json:"company_location" binding:"required,min=2,max=100"`
	BookingDate     string `json:"booking_date" binding:"required"`
	BookingTime     string `json:"booking_time" binding:"required"`
	ContactName     string `json:"contact_name" binding:"required,min=2,max=50"`
	ContactEmail    string `json:"contact_email" binding:"required,email"`
	ContactPhone    string `json:"contact_phone" binding:"required"`
	Notes           string `json:"notes"`
}

type UpdateBookingStatusRequest struct {
	Status       string `json:"status" binding:"required,oneof=pending confirmed rejected completed cancelled"`
	RejectReason string `json:"reject_reason"`
}

type UpdateScheduleSettingsRequest struct {
	Slots []model.ScheduleSetting `json:"slots" binding:"required"`
}

func (h *BookingHandler) GetSlots(c *gin.Context) {
	date := c.Query("date")
	if date == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "date parameter is required",
		})
		return
	}

	slots, err := h.bookingService.GetAvailableSlots(date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取时段失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    slots,
	})
}

func (h *BookingHandler) CreateBooking(c *gin.Context) {
	var req CreateBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误",
		})
		return
	}

	ip := c.ClientIP()
	booking, err := h.bookingService.CreateBooking(
		req.CompanyName,
		req.CompanyLocation,
		req.BookingDate,
		req.BookingTime,
		req.ContactName,
		req.ContactEmail,
		req.ContactPhone,
		req.Notes,
		ip,
	)

	if err != nil {
		status := http.StatusInternalServerError
		message := "预约失败"

		switch {
		case errors.Is(err, service.ErrSlotUnavailable):
			status = http.StatusConflict
			message = "该时段已被预约"
		case errors.Is(err, service.ErrRateLimitIP):
			status = http.StatusTooManyRequests
			message = "请求过于频繁，请稍后再试"
		case errors.Is(err, service.ErrRateLimitEmail):
			status = http.StatusTooManyRequests
			message = "该邮箱今日预约次数已达上限"
		case errors.Is(err, service.ErrNotWeekday):
			status = http.StatusBadRequest
			message = "仅支持工作日预约"
		case errors.Is(err, service.ErrInvalidBookingTime):
			status = http.StatusBadRequest
			message = "无效的预约时间"
		}

		c.JSON(status, gin.H{
			"code":    status,
			"message": message,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "预约成功",
		"data":    booking,
	})
}

func (h *BookingHandler) ListBookings(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	status := c.Query("status")
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	bookings, total, err := h.bookingService.ListBookings(page, pageSize, status, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取预约列表失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data": gin.H{
			"items":     bookings,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

func (h *BookingHandler) GetBooking(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的ID",
		})
		return
	}

	booking, err := h.bookingService.GetBooking(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "预约不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    booking,
	})
}

func (h *BookingHandler) UpdateBookingStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的ID",
		})
		return
	}

	var req UpdateBookingStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误",
		})
		return
	}

	booking, err := h.bookingService.UpdateBookingStatus(uint(id), req.Status, req.RejectReason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新状态失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "更新成功",
		"data":    booking,
	})
}

func (h *BookingHandler) GetScheduleSettings(c *gin.Context) {
	settings, err := h.bookingService.GetScheduleSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取时段设置失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    settings,
	})
}

func (h *BookingHandler) UpdateScheduleSettings(c *gin.Context) {
	var req UpdateScheduleSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误",
		})
		return
	}

	if err := h.bookingService.UpdateScheduleSettings(req.Slots); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新时段设置失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "更新成功",
	})
}

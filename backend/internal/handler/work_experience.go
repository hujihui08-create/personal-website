package handler

import (
	"errors"
	"net/http"
	"strconv"

	"portfolio-backend/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ExperienceHandler struct {
	experienceService *service.ExperienceService
}

func NewExperienceHandler(experienceService *service.ExperienceService) *ExperienceHandler {
	return &ExperienceHandler{experienceService: experienceService}
}

func (h *ExperienceHandler) List(c *gin.Context) {
	experiences, err := h.experienceService.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取工作经历列表失败",
			"data":    nil,
		})
		return
	}

	if experiences == nil {
		experiences = []*service.ExperienceResponse{}
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    experiences,
	})
}

func (h *ExperienceHandler) Create(c *gin.Context) {
	var req service.CreateExperienceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数格式错误",
			"data":    nil,
		})
		return
	}

	experience, err := h.experienceService.Create(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建工作经历失败",
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"code":    200,
		"message": "success",
		"data":    experience,
	})
}

func (h *ExperienceHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的ID",
			"data":    nil,
		})
		return
	}

	var req service.UpdateExperienceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数格式错误",
			"data":    nil,
		})
		return
	}

	experience, err := h.experienceService.Update(uint(id), &req)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "工作经历不存在",
				"data":    nil,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新工作经历失败",
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    experience,
	})
}

func (h *ExperienceHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的ID",
			"data":    nil,
		})
		return
	}

	if err := h.experienceService.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除工作经历失败",
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    nil,
	})
}

func (h *ExperienceHandler) Reorder(c *gin.Context) {
	var req service.ReorderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数格式错误",
			"data":    nil,
		})
		return
	}

	if err := h.experienceService.Reorder(req.IDs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "排序失败",
			"data":    nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    nil,
	})
}

package handler

import (
	"mime/multipart"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ListPRDs GET /api/projects/:id/prds
func (h *ProjectHandler) ListPRDs(c *gin.Context) {
	projectID, err := parseProjectID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的项目ID",
		})
		return
	}

	prds, err := h.prdService.List(projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取 PRD 列表失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
		"data":    prds,
	})
}

// CreatePRD POST /api/projects/:id/prds (multipart form: name, prd_url, file(optional))
func (h *ProjectHandler) CreatePRD(c *gin.Context) {
	projectID, err := parseProjectID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的项目ID",
		})
		return
	}

	name := c.PostForm("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "PRD 名称不能为空",
		})
		return
	}

	prdURL := c.PostForm("prd_url")

	var zipFile multipart.File
	var zipHeader *multipart.FileHeader
	file, header, err := c.Request.FormFile("file")
	if err == nil {
		zipFile = file
		zipHeader = header
	}

	prd, err := h.prdService.Create(projectID, name, prdURL, zipFile, zipHeader)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"code":    200,
		"message": "success",
		"data":    prd,
	})
}

// UpdatePRD PUT /api/projects/:id/prds/:prdId (JSON body: name, prd_url)
func (h *ProjectHandler) UpdatePRD(c *gin.Context) {
	prdID, err := parsePrdID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的 PRD ID",
		})
		return
	}

	var req struct {
		Name   string `json:"name" binding:"required"`
		PrdURL string `json:"prd_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数格式错误",
		})
		return
	}

	if err := h.prdService.Update(prdID, req.Name, req.PrdURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
	})
}

// DeletePRD DELETE /api/projects/:id/prds/:prdId
func (h *ProjectHandler) DeletePRD(c *gin.Context) {
	prdID, err := parsePrdID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的 PRD ID",
		})
		return
	}

	if err := h.prdService.Delete(prdID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
	})
}

// MovePRDUp PUT /api/projects/:id/prds/:prdId/move-up
func (h *ProjectHandler) MovePRDUp(c *gin.Context) {
	prdID, err := parsePrdID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的 PRD ID",
		})
		return
	}

	if err := h.prdService.MoveUp(prdID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
	})
}

// MovePRDDown PUT /api/projects/:id/prds/:prdId/move-down
func (h *ProjectHandler) MovePRDDown(c *gin.Context) {
	prdID, err := parsePrdID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的 PRD ID",
		})
		return
	}

	if err := h.prdService.MoveDown(prdID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "success",
	})
}

// parseProjectID 从 URL 参数 :id 中解析项目 ID
func parseProjectID(c *gin.Context) (uint, error) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}

// parsePrdID 从 URL 参数 :prdId 中解析 PRD ID
func parsePrdID(c *gin.Context) (uint, error) {
	idStr := c.Param("prdId")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}

package service

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	pdf "github.com/ledongthuc/pdf"
	"github.com/unidoc/unioffice/document"
	"github.com/xuri/excelize/v2"
)

type DocumentParser struct{}

func NewDocumentParser() *DocumentParser {
	return &DocumentParser{}
}

func (p *DocumentParser) Parse(filename string, reader io.Reader) (string, error) {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".txt", ".md":
		return p.parseTXT(reader)
	case ".pdf":
		return p.parsePDF(reader)
	case ".docx":
		return p.parseDOCX(reader)
	case ".xlsx":
		return p.parseXLSX(reader)
	case ".doc", ".xls":
		return "", fmt.Errorf("文件格式 %s 暂不支持，请转换为 .docx 或 .xlsx 格式", ext)
	default:
		return "", fmt.Errorf("不支持的文件格式: %s", ext)
	}
}

func (p *DocumentParser) parseTXT(reader io.Reader) (string, error) {
	data, err := io.ReadAll(reader)
	if err != nil {
		return "", fmt.Errorf("读取文本文件失败: %w", err)
	}
	return string(data), nil
}

func (p *DocumentParser) parsePDF(reader io.Reader) (string, error) {
	data, err := io.ReadAll(reader)
	if err != nil {
		return "", fmt.Errorf("读取 PDF 文件失败: %w", err)
	}

	r, err := pdf.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", fmt.Errorf("解析 PDF 文件失败: %w", err)
	}

	var buf bytes.Buffer
	b, err := r.GetPlainText()
	if err != nil {
		return "", fmt.Errorf("提取 PDF 文本失败: %w", err)
	}

	_, err = io.Copy(&buf, b)
	if err != nil {
		return "", fmt.Errorf("读取 PDF 文本内容失败: %w", err)
	}

	return buf.String(), nil
}

func (p *DocumentParser) parseDOCX(reader io.Reader) (string, error) {
	data, err := io.ReadAll(reader)
	if err != nil {
		return "", fmt.Errorf("读取 DOCX 文件失败: %w", err)
	}

	// 创建临时文件
	tmpFile, err := os.CreateTemp("", "*.docx")
	if err != nil {
		return "", fmt.Errorf("创建临时文件失败: %w", err)
	}
	tmpPath := tmpFile.Name()
	defer os.Remove(tmpPath)

	// 写入数据到临时文件
	if _, err := tmpFile.Write(data); err != nil {
		tmpFile.Close()
		return "", fmt.Errorf("写入临时文件失败: %w", err)
	}
	if err := tmpFile.Close(); err != nil {
		return "", fmt.Errorf("关闭临时文件失败: %w", err)
	}

	doc, err := document.Open(tmpPath)
	if err != nil {
		return "", fmt.Errorf("解析 DOCX 文件失败: %w", err)
	}
	defer doc.Close()

	var buf bytes.Buffer
	for _, para := range doc.Paragraphs() {
		for _, run := range para.Runs() {
			buf.WriteString(run.Text())
		}
		buf.WriteString("\n")
	}

	return buf.String(), nil
}

func (p *DocumentParser) parseXLSX(reader io.Reader) (string, error) {
	data, err := io.ReadAll(reader)
	if err != nil {
		return "", fmt.Errorf("读取 XLSX 文件失败: %w", err)
	}

	f, err := excelize.OpenReader(bytes.NewReader(data))
	if err != nil {
		return "", fmt.Errorf("解析 XLSX 文件失败: %w", err)
	}
	defer func() {
		_ = f.Close()
	}()

	var buf bytes.Buffer
	sheets := f.GetSheetList()

	for _, sheet := range sheets {
		buf.WriteString(fmt.Sprintf("=== Sheet: %s ===\n", sheet))
		
		rows, err := f.GetRows(sheet)
		if err != nil {
			continue
		}

		for _, row := range rows {
			for i, cell := range row {
				if i > 0 {
					buf.WriteString("\t")
				}
				buf.WriteString(cell)
			}
			buf.WriteString("\n")
		}
		buf.WriteString("\n")
	}

	return buf.String(), nil
}

package service

import (
	"strings"
	"unicode/utf8"
)

type TextSplitter struct {
	chunkSize    int
	chunkOverlap int
}

func NewTextSplitter(chunkSize, chunkOverlap int) *TextSplitter {
	if chunkSize <= 0 {
		chunkSize = 512
	}
	if chunkOverlap < 0 {
		chunkOverlap = 50
	}
	if chunkOverlap >= chunkSize {
		chunkOverlap = chunkSize / 4
	}
	return &TextSplitter{
		chunkSize:    chunkSize,
		chunkOverlap: chunkOverlap,
	}
}

func (s *TextSplitter) Split(text string) []string {
	if text == "" {
		return []string{}
	}

	paragraphs := s.splitParagraphs(text)

	segments := s.flattenParagraphs(paragraphs)

	if len(segments) == 0 {
		return []string{}
	}

	chunks := s.mergeToChunks(segments)

	if len(chunks) == 0 {
		return segments
	}

	return chunks
}

func (t *TextSplitter) runeLen(str string) int {
	return utf8.RuneCountInString(str)
}

func (s *TextSplitter) splitParagraphs(text string) []string {
	raw := strings.Split(text, "\n\n")

	var result []string
	for _, p := range raw {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		result = append(result, p)
	}
	return result
}

func (s *TextSplitter) flattenParagraphs(paragraphs []string) []string {
	var segments []string

	for _, p := range paragraphs {
		if s.runeLen(p) <= s.chunkSize {
			segments = append(segments, p)
			continue
		}

		sentences := s.splitBySentences(p)
		for _, sent := range sentences {
			if s.runeLen(sent) <= s.chunkSize {
				segments = append(segments, sent)
			} else {
				segments = append(segments, s.splitByWords(sent)...)
			}
		}
	}

	return segments
}

var sentenceSeps = []rune{'。', '！', '？', '；', '\n'}

func (s *TextSplitter) splitBySentences(text string) []string {
	if s.runeLen(text) <= s.chunkSize {
		return []string{text}
	}

	var result []string
	runes := []rune(text)
	start := 0

	for i, r := range runes {
		isSep := false
		for _, sep := range sentenceSeps {
			if r == sep {
				isSep = true
				break
			}
		}

		if isSep {
			sent := strings.TrimSpace(string(runes[start : i+1]))
			if sent != "" {
				result = append(result, sent)
			}
			start = i + 1
		}
	}

	if start < len(runes) {
		remaining := strings.TrimSpace(string(runes[start:]))
		if remaining != "" {
			result = append(result, remaining)
		}
	}

	return result
}

func (s *TextSplitter) splitByWords(text string) []string {
	words := strings.Fields(text)
	if len(words) == 0 {
		return []string{text}
	}

	var chunks []string
	var current []string
	currentLen := 0

	flush := func() {
		if len(current) > 0 {
			chunks = append(chunks, strings.Join(current, " "))
			current = nil
			currentLen = 0
		}
	}

	for _, w := range words {
		wLen := s.runeLen(w)
		if currentLen > 0 {
			wLen++
		}
		if currentLen+wLen > s.chunkSize && len(current) > 0 {
			flush()
		}
		current = append(current, w)
		if len(current) == 1 {
			currentLen = s.runeLen(w)
		} else {
			currentLen += s.runeLen(w) + 1
		}
	}
	flush()

	return chunks
}

func (s *TextSplitter) mergeToChunks(segments []string) []string {
	if len(segments) == 0 {
		return nil
	}

	var chunks []string
	var buf []string
	bufLen := 0
	minChunkLen := s.chunkSize * 2 / 5

	flush := func() {
		if len(buf) > 0 {
			chunks = append(chunks, strings.Join(buf, " "))
			buf = nil
			bufLen = 0
		}
	}

	for _, seg := range segments {
		segLen := s.runeLen(seg)

		if bufLen > 0 {
			segLen++ // 空格分隔
		}
		wouldExceed := bufLen+segLen > s.chunkSize

		if wouldExceed {
			if bufLen >= minChunkLen {
				flush()
				buf = []string{seg}
				bufLen = s.runeLen(seg)
			} else {
				buf = append(buf, seg)
				bufLen += segLen
				flush()
			}
		} else {
			buf = append(buf, seg)
			bufLen += segLen
		}
	}

	flush()

	return chunks
}

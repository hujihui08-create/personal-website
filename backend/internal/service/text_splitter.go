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

	chunks := []string{}
	words := strings.Fields(text)
	if len(words) == 0 {
		return []string{}
	}

	currentChunk := []string{}
	currentLength := 0

	for _, word := range words {
		wordLength := utf8.RuneCountInString(word)
		if currentLength+wordLength+1 > s.chunkSize {
			if len(currentChunk) > 0 {
				chunks = append(chunks, strings.Join(currentChunk, " "))
			}
			if s.chunkOverlap > 0 && len(chunks) > 0 {
				prevChunkWords := strings.Fields(chunks[len(chunks)-1])
				overlapWords := s.getOverlapWords(prevChunkWords)
				currentChunk = overlapWords
				currentLength = s.countWordsLength(overlapWords)
			} else {
				currentChunk = []string{}
				currentLength = 0
			}
		}
		currentChunk = append(currentChunk, word)
		currentLength += wordLength + 1
	}

	if len(currentChunk) > 0 {
		chunks = append(chunks, strings.Join(currentChunk, " "))
	}

	return chunks
}

func (s *TextSplitter) getOverlapWords(words []string) []string {
	if len(words) == 0 {
		return []string{}
	}
	targetLength := s.chunkOverlap
	currentLength := 0
	result := []string{}
	for i := len(words) - 1; i >= 0; i-- {
		word := words[i]
		wordLength := utf8.RuneCountInString(word)
		if currentLength+wordLength+1 > targetLength {
			break
		}
		result = append([]string{word}, result...)
		currentLength += wordLength + 1
	}
	return result
}

func (s *TextSplitter) countWordsLength(words []string) int {
	length := 0
	for i, word := range words {
		if i > 0 {
			length++
		}
		length += utf8.RuneCountInString(word)
	}
	return length
}

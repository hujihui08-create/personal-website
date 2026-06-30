package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	openai "github.com/sashabaranov/go-openai"
)

// HarnessConfig holds the execution parameters for the AgentHarness.
type HarnessConfig struct {
	MaxSteps       int    `json:"max_steps"`
	TimeoutSeconds int    `json:"timeout_seconds"`
	LoopStrategy   string `json:"loop_strategy"` // currently only "react"
}

// DefaultHarnessConfig returns sensible defaults.
func DefaultHarnessConfig() HarnessConfig {
	return HarnessConfig{
		MaxSteps:       5,
		TimeoutSeconds: 120,
		LoopStrategy:   "react",
	}
}

// HarnessStep records one iteration of the ReAct loop.
type HarnessStep struct {
	StepNumber int                    `json:"step_number"`
	LLMOutput  string                 `json:"llm_output"`
	ToolCall   *HarnessToolCall       `json:"tool_call,omitempty"`
	ToolResult map[string]interface{} `json:"tool_result,omitempty"`
	DurationMs int64                  `json:"duration_ms"`
	TokenUsage *HarnessTokenUsage     `json:"token_usage,omitempty"`
}

// HarnessToolCall represents an LLM-initiated tool call.
type HarnessToolCall struct {
	Name      string                 `json:"name"`
	Arguments map[string]interface{} `json:"arguments"`
}

// HarnessTokenUsage records token consumption for a step.
type HarnessTokenUsage struct {
	Prompt     int `json:"prompt"`
	Completion int `json:"completion"`
	Total      int `json:"total"`
}

// HarnessTrace is the complete execution trace.
type HarnessTrace struct {
	Steps           []HarnessStep `json:"steps"`
	TotalDurationMs int64         `json:"total_duration_ms"`
	TotalTokens     int           `json:"total_tokens"`
}

// ToolExecutor is a function that executes a tool given its arguments.
type ToolExecutor func(args map[string]interface{}) (map[string]interface{}, error)

// ToolRegistry manages tool definitions and their executors.
type ToolRegistry struct {
	executors map[string]ToolExecutor
}

// NewToolRegistry creates a new tool registry.
func NewToolRegistry() *ToolRegistry {
	return &ToolRegistry{
		executors: make(map[string]ToolExecutor),
	}
}

// Register adds a tool executor.
func (r *ToolRegistry) Register(name string, executor ToolExecutor) {
	r.executors[name] = executor
}

// Execute runs a tool by name with given arguments.
func (r *ToolRegistry) Execute(name string, args map[string]interface{}) (map[string]interface{}, error) {
	executor, ok := r.executors[name]
	if !ok {
		return nil, fmt.Errorf("tool not found: %s", name)
	}
	return executor(args)
}

// IsRegistered checks if a tool is registered.
func (r *ToolRegistry) IsRegistered(name string) bool {
	_, ok := r.executors[name]
	return ok
}

// AgentHarness manages the ReAct execution loop.
type AgentHarness struct {
	toolRegistry *ToolRegistry
}

// NewAgentHarness creates a new AgentHarness.
func NewAgentHarness(toolRegistry *ToolRegistry) *AgentHarness {
	return &AgentHarness{toolRegistry: toolRegistry}
}

// Run executes the ReAct loop:
//
//	for step < maxSteps:
//	    call LLM with messages + tools
//	    if LLM returns content (no tool_calls):
//	        append content to response, break
//	    if LLM returns tool_calls:
//	        execute each tool, append results to messages
//	        continue loop
func (h *AgentHarness) Run(
	ctx context.Context,
	client *openai.Client,
	model string,
	messages []openai.ChatCompletionMessage,
	tools []openai.Tool,
	config HarnessConfig,
) (string, *HarnessTrace) {
	startTime := time.Now()
	trace := &HarnessTrace{Steps: []HarnessStep{}}

	// Apply timeout
	timeoutCtx, cancel := context.WithTimeout(ctx, time.Duration(config.TimeoutSeconds)*time.Second)
	defer cancel()

	var finalResponse strings.Builder

	for step := 0; step < config.MaxSteps; step++ {
		select {
		case <-timeoutCtx.Done():
			finalResponse.WriteString("\n(对话超时，请稍后再试)")
			return finalResponse.String(), trace
		default:
		}

		stepStart := time.Now()
		stepTrace := HarnessStep{StepNumber: step + 1}

		req := openai.ChatCompletionRequest{
			Model:       model,
			Messages:    messages,
			Tools:       tools,
			ToolChoice:  "auto",
			Temperature: 0.7,
		}

		resp, err := client.CreateChatCompletion(timeoutCtx, req)
		if err != nil {
			log.Printf("[AgentHarness] LLM call failed at step %d: %v", step+1, err)
			finalResponse.WriteString("抱歉，服务暂时不可用。")
			stepTrace.LLMOutput = fmt.Sprintf("Error: %v", err)
			stepTrace.DurationMs = time.Since(stepStart).Milliseconds()
			trace.Steps = append(trace.Steps, stepTrace)
			trace.TotalDurationMs = time.Since(startTime).Milliseconds()
			return finalResponse.String(), trace
		}

		if resp.Usage.TotalTokens > 0 {
			stepTrace.TokenUsage = &HarnessTokenUsage{
				Prompt:     resp.Usage.PromptTokens,
				Completion: resp.Usage.CompletionTokens,
				Total:      resp.Usage.TotalTokens,
			}
			trace.TotalTokens += resp.Usage.TotalTokens
		}

		choice := resp.Choices[0]
		hasToolCalls := len(choice.Message.ToolCalls) > 0

		if !hasToolCalls {
			// No tool calls, LLM is done
			content := choice.Message.Content
			finalResponse.WriteString(content)
			stepTrace.LLMOutput = content

			// Append assistant message to history
			messages = append(messages, choice.Message)

			stepTrace.DurationMs = time.Since(stepStart).Milliseconds()
			trace.Steps = append(trace.Steps, stepTrace)
			trace.TotalDurationMs = time.Since(startTime).Milliseconds()
			return finalResponse.String(), trace
		}

		// Process tool calls
		stepTrace.LLMOutput = choice.Message.Content

		// Append assistant message (with tool_calls) to history
		messages = append(messages, choice.Message)

		for _, tc := range choice.Message.ToolCalls {
			var args map[string]interface{}
			if err := json.Unmarshal([]byte(tc.Function.Arguments), &args); err != nil {
				log.Printf("[AgentHarness] Failed to parse tool arguments for %s: %v", tc.Function.Name, err)
				messages = append(messages, openai.ChatCompletionMessage{
					Role:       openai.ChatMessageRoleTool,
					Content:    fmt.Sprintf(`{"error": "invalid arguments: %v"}`, err),
					ToolCallID: tc.ID,
				})
				continue
			}

			stepTrace.ToolCall = &HarnessToolCall{
				Name:      tc.Function.Name,
				Arguments: args,
			}

			result, err := h.toolRegistry.Execute(tc.Function.Name, args)
			if err != nil {
				log.Printf("[AgentHarness] Tool %s failed: %v", tc.Function.Name, err)
				result = map[string]interface{}{"error": err.Error()}
			}

			stepTrace.ToolResult = result

			resultJSON, _ := json.Marshal(result)
			messages = append(messages, openai.ChatCompletionMessage{
				Role:       openai.ChatMessageRoleTool,
				Content:    string(resultJSON),
				ToolCallID: tc.ID,
				Name:       tc.Function.Name,
			})
		}

		stepTrace.DurationMs = time.Since(stepStart).Milliseconds()
		trace.Steps = append(trace.Steps, stepTrace)
	}

	// Max steps reached
	finalResponse.WriteString("(处理超时，请简化您的问题)")
	trace.TotalDurationMs = time.Since(startTime).Milliseconds()
	return finalResponse.String(), trace
}

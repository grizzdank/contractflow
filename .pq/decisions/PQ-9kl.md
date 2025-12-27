<!-- Generated from nodes.jsonl - edit via: pq edit PQ-9kl -->

# PQ-9kl: OpenRouter for LLM integration instead of direct API

**Status:** accepted
**Created:** 2025-12-27
**Tags:** #architecture #ai

## Context

The SOW Generator needs an LLM to generate content. We had API key placeholders for both OpenAI and Anthropic but needed to choose an integration approach.

## Decision

Use **OpenRouter** as an LLM gateway instead of direct Anthropic/OpenAI API calls.

OpenRouter provides:
- Single API, multiple models (Claude, GPT-4, Llama, Mistral, etc.)
- Easy model switching by changing one string
- Automatic fallback if a provider is down
- Usage tracking across all models
- OpenAI-compatible API format

## Alternatives Considered

1. **Direct Anthropic API** - Rejected: vendor lock-in, no fallback
2. **Direct OpenAI API** - Rejected: vendor lock-in, no fallback
3. **Build our own router** - Rejected: unnecessary complexity
4. **LangChain/LlamaIndex** - Rejected: overkill for single use case

## Consequences

- Can A/B test models easily (e.g., Claude for quality, Llama for cost)
- Single secret to manage (`OPENROUTER_API_KEY`)
- Small latency overhead (~50-100ms) acceptable for SOW generation
- Default model: `anthropic/claude-3.5-sonnet` (can be changed per-request)

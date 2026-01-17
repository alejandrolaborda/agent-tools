# Agent Anthropic

MCP server that exposes Anthropic Claude as an agent for the second-opinion orchestrator.

## Overview

This is a standalone MCP server that provides a single `agent_query` tool for querying Anthropic's Claude API. It's designed to be spawned and managed by the `second-opinion` orchestrator.

## Configuration

Set these environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | - | Your Anthropic API key |
| `ANTHROPIC_MODEL` | No | `claude-sonnet-4-20250514` | Model to use |
| `ANTHROPIC_ENDPOINT` | No | `https://api.anthropic.com/v1` | API endpoint |
| `ANTHROPIC_TIMEOUT` | No | `30000` | Request timeout in ms |

## Tool

### `agent_query`

Query the Anthropic Claude agent with a question and optional context.

**Input:**
```json
{
  "query": "How should I handle this error?",
  "context": "Error: Cannot read property 'foo' of undefined",
  "systemPrompt": "You are a helpful coding assistant..."
}
```

**Output:**
```json
{
  "response": "The response from Claude...",
  "tokensUsed": 150,
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514"
}
```

## Building

```bash
cd mcp
npm install
npm run build
```

## Usage

This MCP is typically spawned by the `second-opinion` orchestrator, not used directly.

```bash
ANTHROPIC_API_KEY=sk-ant-... node dist/index.js
```

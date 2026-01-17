# Agent OpenAI

MCP server that exposes OpenAI as an agent for the second-opinion orchestrator.

## Overview

This is a standalone MCP server that provides a single `agent_query` tool for querying OpenAI's API. It's designed to be spawned and managed by the `second-opinion` orchestrator.

## Configuration

Set these environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | Your OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4o` | Model to use |
| `OPENAI_ENDPOINT` | No | `https://api.openai.com/v1` | API endpoint |
| `OPENAI_TIMEOUT` | No | `30000` | Request timeout in ms |

## Tool

### `agent_query`

Query the OpenAI agent with a question and optional context.

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
  "response": "The response from OpenAI...",
  "tokensUsed": 150,
  "provider": "openai",
  "model": "gpt-4o"
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
OPENAI_API_KEY=sk-... node dist/index.js
```

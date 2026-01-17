# Agent Gemini

MCP server that exposes Google Gemini as an agent for the second-opinion orchestrator.

## Overview

This is a standalone MCP server that provides a single `agent_query` tool for querying Google's Gemini API. It's designed to be spawned and managed by the `second-opinion` orchestrator.

## Configuration

Set these environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | Yes | - | Your Google AI API key |
| `GEMINI_MODEL` | No | `gemini-2.0-flash` | Model to use |
| `GEMINI_ENDPOINT` | No | `https://generativelanguage.googleapis.com/v1beta` | API endpoint |
| `GEMINI_TIMEOUT` | No | `30000` | Request timeout in ms |

## Tool

### `agent_query`

Query the Google Gemini agent with a question and optional context.

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
  "response": "The response from Gemini...",
  "tokensUsed": 150,
  "provider": "google",
  "model": "gemini-2.0-flash"
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
GOOGLE_API_KEY=... node dist/index.js
```

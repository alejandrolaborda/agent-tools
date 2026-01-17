# Agent GitHub

MCP server that exposes GitHub Models as an agent for the second-opinion orchestrator.

## Overview

This is a standalone MCP server that provides a single `agent_query` tool for querying GitHub's Models API (Azure-hosted). It's designed to be spawned and managed by the `second-opinion` orchestrator.

## Configuration

Set these environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_TOKEN` | Yes | - | Your GitHub token with Models access |
| `GITHUB_MODELS_MODEL` | No | `gpt-4o` | Model to use |
| `GITHUB_MODELS_ENDPOINT` | No | `https://models.inference.ai.azure.com` | API endpoint |
| `GITHUB_MODELS_TIMEOUT` | No | `30000` | Request timeout in ms |

## Tool

### `agent_query`

Query the GitHub Models agent with a question and optional context.

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
  "response": "The response from GitHub Models...",
  "tokensUsed": 150,
  "provider": "github",
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
GITHUB_TOKEN=ghp_... node dist/index.js
```

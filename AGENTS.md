# Agent Tools Specification

## Project Goal

Multi-model agent/skill repository for Claude Code, Codex, Gemini.

## Reference Sources

| Source | URL | Use For |
|--------|-----|---------|
| Claude Code Docs | https://code.claude.com/docs/en | Plugins, hooks, skills |
| Agent Skills Spec | https://agentskills.io/ | SKILL.md schema |
| Anthropic Skills | https://github.com/anthropics/skills | Reference implementations |

## Directory Structure

```
plugins/
├── <plugin-name>/
│   ├── .claude-plugin/
│   │   └── plugin.json
│   ├── skills/
│   │   └── <skill-name>/
│   │       ├── SKILL.md
│   │       ├── scripts/
│   │       ├── references/
│   │       └── configs/
│   ├── agents/
│   │   └── <agent-name>/
│   │       └── AGENT.md
│   ├── hooks/
│   │   └── hooks.json
│   └── README.md
```

## plugin.json Schema

```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "description": "What plugin provides",
  "author": { "name": "Author" },
  "license": "Apache-2.0",
  "keywords": ["relevant", "tags"]
}
```

**Version bumps required on every edit.**

## SKILL.md Schema

```yaml
---
name: skill-name                    # Required, 1-64 chars, lowercase-hyphens
description: |                      # Required, max 1024 chars
  What it does. When to use it. Include trigger keywords.
license: Apache-2.0                 # Optional
compatibility: macOS, Xcode 16      # Optional, max 500 chars
metadata:                           # Optional
  version: "1.0"
  target-software-version: "6.0"
  last-updated: "2026-01-16"
---

# Skill Title

## Section
Content, code examples, tables.
```

**Name rules:**
- `a-z`, `0-9`, `-` only
- No `--`, no leading/trailing `-`
- Must match folder name

**Description must:**
- State what skill does
- State when to activate
- Include trigger keywords

**Body constraints:**
- < 5000 tokens
- Use latest stable APIs
- No deprecated methods

## AGENT.md Schema

```yaml
---
name: agent-name                    # Required
description: |                      # Required
  When to spawn. What it handles.
model: sonnet                       # Optional: sonnet|opus|haiku
tools: [Read, Glob, Grep]           # Optional: tool whitelist
trigger: ["@agent", "keywords"]     # Optional: activation triggers
---

# Agent Title

System prompt content.
```

**Tool allocation:**

| Agent Type | Tools |
|------------|-------|
| Explorer | Read, Glob, Grep, LS |
| Reviewer | Read, Glob, Grep |
| Architect | Read, Glob, Grep, TodoWrite |
| Developer | All |
| Research | Read, WebFetch, WebSearch |

## hooks.json Schema

```json
{
  "hooks": [
    {
      "event": "SessionStart|PreToolUse|PostToolUse|Stop",
      "type": "prompt",
      "matcher": "always|pattern",
      "prompt": "Instruction text"
    }
  ]
}
```

## Validation Checklist

Before commit:
- [ ] `plugin.json` version bumped
- [ ] Names: lowercase-hyphens, match folders
- [ ] Descriptions: include triggers, < 1024 chars
- [ ] Instructions: < 5000 tokens
- [ ] APIs: current, not deprecated
- [ ] Metadata: `last-updated` current

## Validation Commands

```bash
skills-ref validate ./plugins/<plugin>/skills/<skill>
skills-ref validate ./plugins/<plugin>/skills/*
skills-ref to-prompt ./plugins/<plugin>/skills/<skill>
```

## Marketplace

`/.claude-plugin/marketplace.json`:
```json
{
  "plugins": {
    "plugin-name": {
      "path": "./plugins/plugin-name",
      "version": "1.0.0",
      "description": "Short description"
    }
  }
}
```

Install: `/plugin install <plugin-name>@agent-tools`

## Quality Requirements

- Type-checked (mypy/pyright)
- Test coverage >= 90%
- No hardcoded secrets/paths
- macOS + Linux compatible
- No external network calls in core logic

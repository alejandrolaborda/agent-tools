# Agent Tools

## On Every Plugin Edit

1. Bump version in `.claude-plugin/plugin.json`
2. PATCH (fix) | MINOR (new skill/agent) | MAJOR (breaking)

## Naming Rules

| Element | Rule |
|---------|------|
| Skills/Agents | `lowercase-with-hyphens` only |
| No | uppercase, spaces, `--`, leading/trailing `-` |
| Folder | Must match `name` field |

## Creating Skills

```
plugins/<plugin>/skills/<skill-name>/
├── SKILL.md          # Required
├── scripts/          # Optional
├── references/       # Optional
└── configs/          # Optional
```

**SKILL.md frontmatter:**
```yaml
---
name: skill-name          # Required, match folder
description: |            # Required, max 1024 chars
  What it does. When to use. Trigger keywords.
---
```

- Instructions < 5000 tokens
- Include trigger keywords in description
- No deprecated APIs

## Creating Agents

```
plugins/<plugin>/agents/<agent-name>/
└── AGENT.md          # Required
```

**AGENT.md frontmatter:**
```yaml
---
name: agent-name
description: When to spawn. What it does.
model: sonnet|opus|haiku
tools: [Glob, Grep, Read, Edit, Write, Bash, WebFetch, WebSearch, TodoWrite]
---
```

**Tool access — minimal privilege:**
| Type | Tools |
|------|-------|
| Explorer | Read, Glob, Grep, LS |
| Reviewer | Read, Glob, Grep |
| Architect | Read, Glob, Grep, TodoWrite |
| Developer | All |

## Validation

```bash
skills-ref validate ./plugins/<plugin>/skills/<skill>
```

## Plugin Structure

```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json       # name, version, description
├── skills/
├── agents/
├── hooks/
│   └── hooks.json        # Optional
└── README.md
```

## MCP Tools Available

- **Context7**: `resolve-library-id`, `query-docs` — latest documentation
- **Serena**: `find_symbol`, `get_symbols_overview` — code navigation
- **Sentry**: error tracking queries

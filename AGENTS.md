## Project Name
Agent Tools

## Vision
Create a unified, modular repository that stores and manages top-level agents and reusable skills designed for multi-model AI ecosystems, including Claude Code, OpenAI Codex, and Google Gemini. The repository will serve as a foundational toolkit for orchestrating agent behaviors, composable reasoning skills, and shared capabilities across various AI frameworks.

## Reference Documentation & Standards

This project follows established standards and documentation from the following authoritative sources:

### Claude Code Documentation
- **URL:** https://code.claude.com/docs/en
- **Purpose:** Official documentation for Claude Code CLI, including hooks, skills, agents, MCP servers, and plugin development
- **Use for:** Understanding Claude Code architecture, creating compatible skills and agents, plugin structure
- **Key Pages:**
  - `/en/skills` - Agent Skills guide
  - `/en/sub-agents` - Custom subagent creation
  - `/en/plugins` - Plugin development
  - `/en/plugins-reference` - Complete plugin schema
  - `/en/hooks` - Hooks reference

### Agent Skills Standards
- **URL:** https://agentskills.io/
- **Purpose:** Community standards for defining portable, interoperable agent skills
- **Use for:** Skill schema definitions, cross-platform compatibility, skill packaging conventions
- **Key Pages:**
  - `/specification` - Complete SKILL.md schema
  - `/integrate-skills` - Integration guide for tool developers

### Anthropic Skills Repository
- **URL:** https://github.com/anthropics/skills
- **Purpose:** Official example implementations and templates from Anthropic
- **Use for:** Reference implementations, best practices, skill templates, testing patterns
- **Key Resources:**
  - `/template` - Starter template for new skills
  - `/skills` - Example skills organized by category
  - `/spec` - Agent Skills specification

## Functional Requirements
- Define a standard folder structure for organizing agents and skills.
- Provide an agent registration and discovery system.
- Support versioned skill definitions reusable across agents.
- Offer model-specific compatibility layers (Claude, Codex, Gemini).
- Include clear documentation templates for each agent/skill.
- Provide tests to verify agent-skill interoperability.
- Follow Agent Skills Standards (agentskills.io) for skill definitions.
- Use Claude Code documentation patterns for hook and plugin development.

## Non-Functional Requirements
- The repository should be easily extensible for future AI model integrations.
- Must be compatible with Python-based agent frameworks (LangChain, LlamaIndex, etc.).
- Ensure consistent naming and schema across agents.
- All modules must be type-checked (mypy or pyright).
- High test coverage (>=90%).

## Constraints
- No external network calls in core logic.
- Must run on macOS and Linux.

## Architecture Assumptions
- Each agent is a composable unit with declared dependencies.
- Skills are atomic functional components following agentskills.io schema.
- A registry module allows dynamic discovery of available skills.
- Config files define the mapping between models and compatible skills.
- Skill and agent definitions align with Anthropic's reference implementations.

## Skill Development Guidelines

### Project Skills Directory Structure

All skills live in the `skills/` folder at the project root. Each skill has its own dedicated subfolder:

```
skills/
├── pdf-processing/
│   ├── SKILL.md           # Required: frontmatter + instructions
│   ├── scripts/           # Optional: executable code (Python, Bash, JS)
│   ├── references/        # Optional: additional documentation
│   └── assets/            # Optional: templates, images, data files
├── code-review/
│   └── SKILL.md
├── data-analysis/
│   ├── SKILL.md
│   └── scripts/
│       └── analyze.py
└── ...
```

### Individual Skill Structure

Each skill folder must contain a `SKILL.md` file at its root:

### Required Frontmatter Schema

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | Yes | Max 64 chars. Lowercase letters, numbers, hyphens only. Must match parent folder name. |
| `description` | Yes | Max 1024 chars. Describes what skill does AND when to use it. Include trigger keywords. |
| `license` | No | License name or reference to bundled LICENSE file. |
| `compatibility` | No | Max 500 chars. Environment requirements (products, packages, network access). |
| `metadata` | No | Key-value map for custom properties (author, version, etc.). |
| `allowed-tools` | No | Space-delimited list of pre-approved tools (experimental). |

### Name Field Rules
- 1-64 characters
- Only lowercase alphanumeric and hyphens (`a-z`, `0-9`, `-`)
- Cannot start/end with hyphen
- No consecutive hyphens (`--`)

**Valid:** `pdf-processing`, `code-review`, `data-analysis`
**Invalid:** `PDF-Processing`, `-pdf`, `pdf--processing`

### Writing Effective Descriptions

The description field is CRITICAL for skill activation. It must:
1. Explain WHAT the skill does
2. Explain WHEN Claude should use it
3. Include specific trigger keywords

**Good Example:**
```yaml
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.
```

**Poor Example:**
```yaml
description: Helps with PDFs.
```

### Progressive Disclosure Pattern

Structure skills for efficient context usage:

| Layer | Token Budget | When Loaded |
|-------|--------------|-------------|
| Metadata | ~100 tokens | Always (startup) |
| Instructions | <5000 tokens | When skill activated |
| Resources | As needed | On-demand only |

### Instruction Body Best Practices

1. **Be specific and actionable** - Include step-by-step procedures
2. **Provide examples** - Show inputs and expected outputs
3. **Handle edge cases** - Document common failure modes
4. **Keep it focused** - One skill = one capability domain
5. **Test thoroughly** - Validate in target environment before deployment

### Version & Documentation Requirements

When creating or updating skills, always use the **latest stable version** of the target software and documentation:

1. **Check official documentation** - Always fetch current docs before writing instructions
2. **Specify version in metadata** - Record the version the skill was written for
3. **Use Context7 MCP** - Query latest documentation via `resolve-library-id` and `query-docs`
4. **Verify API compatibility** - Ensure examples work with current APIs
5. **Date the skill** - Include `last-updated` in metadata for freshness tracking

**Metadata Example:**
```yaml
metadata:
  version: "1.0"
  target-software-version: "3.12"  # Version skill was written for
  last-updated: "2026-01-12"
  docs-source: "https://docs.example.com/v3.12"
```

**Before Writing a Skill:**
- Use WebSearch to find the latest stable version
- Use Context7 to query current documentation
- Verify deprecated methods/APIs are not used
- Check for breaking changes in recent releases

## Subagent Development Guidelines

### What Are Subagents?

Subagents are specialized AI agents that Claude can spawn to handle specific tasks autonomously. They have:
- Dedicated system prompts optimized for their domain
- Restricted tool access (principle of least privilege)
- Clear triggering conditions based on task type

### Project Agents Directory Structure

All subagents live in the `agents/` folder at the project root. Each agent has its own dedicated subfolder:

```
agents/
├── code-reviewer/
│   ├── AGENT.md           # Required: frontmatter + system prompt
│   └── resources/         # Optional: reference materials
├── code-explorer/
│   └── AGENT.md
├── code-architect/
│   ├── AGENT.md
│   └── resources/
│       └── architecture-patterns.md
└── ...
```

### Individual Agent Structure

Each agent folder must contain an `AGENT.md` file at its root:

### AGENT.md Frontmatter Schema

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Unique identifier (lowercase-with-hyphens) |
| `description` | Yes | When and why to spawn this agent |
| `tools` | No | List of tools this agent can access |
| `model` | No | Preferred model (sonnet, opus, haiku) |

### Writing Effective Agent Descriptions

The description determines when the orchestrating agent spawns your subagent:

**Good Example:**
```yaml
description: Use this agent when reviewing code for bugs, security vulnerabilities, and adherence to project conventions. Best for PR reviews, code audits, and quality checks.
```

**Poor Example:**
```yaml
description: Reviews code.
```

### Tool Access Patterns

Follow the principle of least privilege:

| Agent Type | Recommended Tools |
|------------|-------------------|
| Code Explorer | Read, Glob, Grep, LS |
| Code Reviewer | Read, Glob, Grep (no write) |
| Code Architect | Read, Glob, Grep, TodoWrite |
| Feature Developer | All tools |
| Research Agent | Read, WebFetch, WebSearch |

### Subagent Design Principles

1. **Single responsibility** - Each agent does one thing well
2. **Clear boundaries** - Define explicit scope in description
3. **Minimal tools** - Only grant necessary capabilities
4. **Thorough prompts** - System prompts should be comprehensive
5. **Example-driven** - Include usage examples in description

## Quality Checklist for Skills & Agents

### Before Deployment

- [ ] Name follows lowercase-hyphen convention
- [ ] Description is 50-200 words with clear triggers
- [ ] Frontmatter validates against schema
- [ ] Instructions are under 5000 tokens
- [ ] Examples demonstrate common use cases
- [ ] Edge cases are documented
- [ ] Tested in target environment (Claude Code, Claude.ai, API)
- [ ] No hardcoded secrets or paths
- [ ] License specified if distributing
- [ ] Uses latest stable version of target software
- [ ] Documentation sources are current (not outdated tutorials)
- [ ] No deprecated APIs or methods used
- [ ] Version recorded in metadata (`target-software-version`, `last-updated`)

### Description Quality Test

Ask yourself:
1. Would Claude know when to activate this skill?
2. Are trigger keywords explicit?
3. Is the scope clear (what it does AND doesn't do)?

### Validation Commands

```bash
# Validate a specific skill
skills-ref validate ./skills/my-skill

# Validate all skills in the skills folder
skills-ref validate ./skills/*

# Generate prompt XML for testing
skills-ref to-prompt ./skills/my-skill
```

## Plugin Versioning Rules

> **CRITICAL**: Bump the semver version in `plugin.json` on EVERY edit to a plugin.

### Why This Matters
- Users with auto-update enabled only receive changes when the version number increases
- Without a version bump, changes won't propagate to installed plugins

### When to Bump

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Bug fix, typo | PATCH | `1.0.0` → `1.0.1` |
| New skill/agent/command | MINOR | `1.0.1` → `1.1.0` |
| Breaking changes | MAJOR | `1.1.0` → `2.0.0` |

### Checklist Before Committing Plugin Changes

- [ ] Updated `version` in `.claude-plugin/plugin.json`
- [ ] Version follows semver format (`MAJOR.MINOR.PATCH`)
- [ ] Commit message describes what changed

### Example

```json
{
  "name": "apple-shared",
  "version": "1.0.2",  // ← bump this on every edit
  ...
}
```

## Quality Bars
- Full test suite with mock integration tests for each model type.
- Documentation auto-generated from docstrings.
- Linting: flake8 + black.
- CI pipeline runs lint, test, and type-check jobs.

## Configurability
- YAML-based configuration for defining agents, dependencies, and skills.
- Environment-variable overrides for model-specific options.

## Observability & Debugging
- Built-in logging (structured JSON logging recommended).
- Debug mode enables verbose tracing of agent execution.
- Each agent should expose health and diagnostic methods.

## Future Phases
- Phase 2: Add plugin interface for third-party agent skills.
- Phase 3: Introduce UI dashboard for agent management.
- Phase 4: Extend support to other LLMs (Mistral, Anthropic’s next-gen models).

## Open Assumptions
- Assumes consistent APIs across supported models.
- Assumes users have separate environments configured per model.
- Assumes manual deployment and execution by developers at first stage.
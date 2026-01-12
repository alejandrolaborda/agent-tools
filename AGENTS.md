## Project Name
Agent Tools

## Vision
Create a unified, modular repository that stores and manages top-level agents and reusable skills designed for multi-model AI ecosystems, including Claude Code, OpenAI Codex, and Google Gemini. The repository will serve as a foundational toolkit for orchestrating agent behaviors, composable reasoning skills, and shared capabilities across various AI frameworks.

## Non-Goals
- Not focused on front-end interfaces or visualization layers.
- Not responsible for deployment pipelines or hosting.
- Not intended to manage API tokens or credentials for specific models.

## Functional Requirements
- Define a standard folder structure for organizing agents and skills.
- Provide an agent registration and discovery system.
- Support versioned skill definitions reusable across agents.
- Offer model-specific compatibility layers (Claude, Codex, Gemini).
- Include clear documentation templates for each agent/skill.
- Provide tests to verify agent-skill interoperability.

## Non-Functional Requirements
- The repository should be easily extensible for future AI model integrations.
- Must be compatible with Python-based agent frameworks (LangChain, LlamaIndex, etc.).
- Ensure consistent naming and schema across agents.
- All modules must be type-checked (mypy or pyright).
- High test coverage (>=90%).

## Constraints
- Python 3.10+
- No external network calls in core logic.
- Must run on macOS and Linux.

## Architecture Assumptions
- Each agent is a composable unit with declared dependencies.
- Skills are atomic functional components.
- A registry module allows dynamic discovery of available skills.
- Config files define the mapping between models and compatible skills.

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
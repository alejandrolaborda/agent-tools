# Agent Tools

A unified, modular repository for top-level agents and reusable skills designed for multi-model AI ecosystems, including Claude Code, OpenAI Codex, and Google Gemini.

## Structure

```
agent-tools/
├── agents/                 # Subagent definitions
│   └── <agent-name>/
│       └── AGENT.md
├── skills/                 # Skill definitions
│   └── <skill-name>/
│       ├── SKILL.md
│       └── references/
├── AGENTS.md               # Project specification & guidelines
└── README.md               # This file
```

## Available Skills

| Skill | Description | Version |
|-------|-------------|---------|
| [swift-language](skills/swift-language/) | Expert Swift 6.2 programming assistance | 1.0 |

## Available Agents

*Coming soon*

## Documentation

- **[AGENTS.md](AGENTS.md)** - Complete project specification, skill/agent development guidelines
- **[Agent Skills Standard](https://agentskills.io/)** - Community skill specification
- **[Claude Code Docs](https://code.claude.com/docs/en)** - Claude Code CLI documentation

---

## Apple Skills Maintenance

> **IMPORTANT**: Update all Apple-related skills after every Apple event where new versions of libraries, frameworks, or tools are announced.

### Apple-Related Skills

Skills that require updates after Apple events:

| Skill | Platform/Framework |
|-------|-------------------|
| `swift-language` | Swift language |
| `swiftui` | SwiftUI framework (future) |
| `ios-development` | iOS SDK (future) |
| `macos-development` | macOS SDK (future) |
| `xcode` | Xcode tooling (future) |
| `apple-frameworks` | Core frameworks (future) |

### Key Apple Events

| Event | Typical Timing | What Changes |
|-------|----------------|--------------|
| **WWDC** | June | Swift version, new APIs, frameworks, Xcode, all platforms |
| **iPhone Event** | September | iOS SDK, watchOS SDK, new device capabilities |
| **Mac Event** | October/November | macOS SDK, Mac-specific APIs, Apple Silicon |
| **Spring Event** | March (varies) | Minor updates, new device categories |

### Post-Event Update Checklist

After each Apple event, for **each affected skill**:

- [ ] Check version updates:
  - Swift: https://www.swift.org/
  - Apple SDKs: https://developer.apple.com/
  - Xcode: https://developer.apple.com/xcode/
- [ ] Watch relevant WWDC/event sessions
- [ ] Update `target-software-version` in SKILL.md frontmatter
- [ ] Update `last-updated` date in SKILL.md frontmatter
- [ ] Add new features/APIs to relevant sections
- [ ] Mark deprecated APIs with alternatives
- [ ] Update `references/SOURCES.md` with new documentation links
- [ ] Query Context7 MCP for updated documentation
- [ ] Remove outdated patterns/practices
- [ ] Test skill instructions with new toolchain

### Version Tracking

Track Apple software versions across skills:

```yaml
# Example: Update these after each event
swift: "6.2.3"
xcode: "16.2"
ios-sdk: "18.2"
macos-sdk: "15.2"
watchos-sdk: "11.2"
tvos-sdk: "18.2"
visionos-sdk: "2.2"
```

---

## Contributing

See [AGENTS.md](AGENTS.md) for:
- Skill development guidelines
- Agent development guidelines
- Quality checklist
- Validation commands

## License

Apache-2.0

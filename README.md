# Agent Tools

A Claude Code plugin marketplace for Apple platform development, with specialized agents and reusable skills.

## Usage

### Local Development (Testing)

Load plugins directly from this directory:

```bash
# Load a single plugin
claude --plugin-dir ./plugins/apple-shared

# Load multiple plugins
claude --plugin-dir ./plugins/apple-shared --plugin-dir ./plugins/apple-tv-dev
```

### Install from GitHub Marketplace

Once this repo is published to GitHub:

```bash
# 1. Add the marketplace (one-time setup)
/plugin marketplace add alejandrolaborda/agent-tools

# 2. Install plugins
/plugin install apple-shared@agent-tools
/plugin install apple-tv-dev@agent-tools
```

Or use the interactive plugin browser:
```bash
/plugin
# Navigate to "Discover" tab → select marketplace → choose plugin
```

### Installation Scopes

```bash
# User scope (default) - available in all your projects
/plugin install apple-shared@agent-tools

# Project scope - shared with team via .claude/settings.json
claude plugin install apple-shared@agent-tools --scope project

# Local scope - gitignored, personal use
claude plugin install apple-shared@agent-tools --scope local
```

### Team Configuration

Add to `.claude/settings.json` for automatic team setup:

```json
{
  "extraKnownMarketplaces": {
    "agent-tools": {
      "source": {
        "source": "github",
        "repo": "alejandrolaborda/agent-tools"
      }
    }
  },
  "enabledPlugins": {
    "apple-shared@agent-tools": true,
    "apple-tv-dev@agent-tools": true
  }
}
```

### Managing Plugins

```bash
# List installed plugins
/plugin

# Disable without uninstalling
/plugin disable apple-shared@agent-tools

# Re-enable
/plugin enable apple-shared@agent-tools

# Uninstall
/plugin uninstall apple-shared@agent-tools
```

### Updates

**Auto-updates** are disabled by default for third-party marketplaces. Enable via:
```bash
/plugin
# → Marketplaces tab → select "agent-tools" → Enable auto-update
```

**Manual updates:**
```bash
# Refresh marketplace listings
/plugin marketplace update agent-tools

# Update a specific plugin
claude plugin update apple-shared@agent-tools
```

**Environment variables:**
```bash
# Disable ALL auto-updates (Claude Code + plugins)
export DISABLE_AUTOUPDATER=true

# Keep plugin auto-updates while disabling Claude Code updates
export DISABLE_AUTOUPDATER=true
export FORCE_AUTOUPDATE_PLUGINS=true
```

When auto-update is enabled, Claude Code checks for updates at startup and notifies you to restart if plugins were updated.

## Structure

```
agent-tools/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace manifest
├── plugins/
│   ├── apple-shared/             # Shared Apple platform skills
│   │   ├── .claude-plugin/plugin.json
│   │   └── skills/
│   │       ├── swift-language/   # Swift 6.2 expert
│   │       ├── app-store-review/ # Guidelines compliance
│   │       └── ...
│   └── apple-tv-dev/             # Apple TV development
│       ├── .claude-plugin/plugin.json
│       ├── agents/               # Specialized sub-agents
│       ├── skills/               # tvOS-specific skills
│       └── commands/             # Slash commands
├── AGENTS.md                     # Development guidelines
└── README.md
```

## Plugins

### apple-shared
Shared skills for all Apple platforms (iOS, macOS, tvOS, visionOS).

| Skill | Description | Status |
|-------|-------------|--------|
| `swift-language` | Swift 6.2 expert | Ready |
| `app-store-review` | App Store guidelines | Planned |
| `app-store-connect` | Publishing workflow | Planned |
| `accessibility` | VoiceOver, accessibility | Planned |
| `localization` | i18n/l10n | Planned |

### apple-tv-dev
Apple TV/tvOS development with specialized agents.

**Skills:**
| Skill | Description | Status |
|-------|-------------|--------|
| `swiftui-tvos` | SwiftUI + focus system | Building |
| `focus-engine` | tvOS navigation | Planned |
| `avkit-media` | Video/audio playback | Planned |
| `gamekit` | Game Center | Planned |
| `metal-graphics` | High-perf graphics | Planned |
| `testflight-qa` | Testing workflow | Planned |

**Agents:**
| Agent | Role |
|-------|------|
| `developer` | Code implementation |
| `designer` | UI/UX, HIG compliance |
| `qa-tester` | Testing, automation |
| `publisher` | App Store submission |
| `legal` | Privacy, compliance |
| `media` | Video/audio specialist |

## Documentation

- **[AGENTS.md](AGENTS.md)** - Development guidelines
- **[Claude Code Plugins](https://code.claude.com/docs/en/plugins)** - Plugin documentation
- **[Agent Skills Standard](https://agentskills.io/)** - Skill specification

---

## Apple Skills Maintenance

> **IMPORTANT**: Update all Apple-related skills after every Apple event.

### Key Events

| Event | Timing | Updates |
|-------|--------|---------|
| **WWDC** | June | Swift, APIs, frameworks, Xcode |
| **iPhone Event** | September | iOS/watchOS SDK |
| **Mac Event** | Oct/Nov | macOS SDK, Apple Silicon |

### Post-Event Checklist

- [ ] Check https://www.swift.org/ and https://developer.apple.com/
- [ ] Update `target-software-version` in SKILL.md
- [ ] Update `last-updated` date
- [ ] Add new features, mark deprecated APIs
- [ ] Query Context7 MCP for updated docs

### Current Versions

```yaml
swift: "6.2.3"
xcode: "16.2"
tvos-sdk: "18.2"
```

## License

Apache-2.0

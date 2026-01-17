---
name: localization
description: Internationalization and localization - String Catalogs, formatters, RTL support, locale handling. Triggers on i18n, l10n, translation, internationalization.
---

# Localization

## String Catalogs (Xcode 15+)

Create: File → New → String Catalog → Localizable.xcstrings

```swift
// Auto-extracted to String Catalog
Text("Welcome")
Text("Level", comment: "Current game level label")
Text("Score: \(score)")  // → "Score: %lld"
Text("^[\(count) item](inflect: true)")  // Auto pluralization

// Non-localized
Text(verbatim: "v1.2.3")

// LocalizedStringKey
let title: LocalizedStringKey = "main_title"
Text(title)

// String initialization
let message = String(localized: "Game saved successfully")
let custom = String(localized: "Welcome", table: "Onboarding")
```

## UIKit

```swift
let title = NSLocalizedString("Settings", comment: "Settings screen title")
let welcome = NSLocalizedString("welcome_message", tableName: "Onboarding", comment: "")
let message = String(format: NSLocalizedString("score_format", comment: ""), score)
```

## Formatters

```swift
// Numbers
Text(29.99, format: .currency(code: "USD"))  // $29.99
Text(1500000, format: .number.notation(.compactName))  // 1.5M
Text(0.85, format: .percent)  // 85%

// Dates
Text(date, format: .relative(presentation: .named))  // "tomorrow"
Text(date, format: .dateTime.day().month().year())  // Jan 12, 2026
Text(duration, format: .time(pattern: .hourMinuteSecond))  // 1:01:01

// Lists & Measurements
Text(items, format: .list(type: .and))  // Apple, Banana, and Orange
Text(Measurement(value: 5, unit: UnitLength.kilometers), format: .measurement(width: .wide))
```

## RTL Support

```swift
// SwiftUI handles RTL automatically for HStack
// Force direction
HStack { }.environment(\.layoutDirection, .rightToLeft)

// UIKit
view.semanticContentAttribute = .forceLeftToRight
view.semanticContentAttribute = .playback  // Audio/video controls

// Directional images
Image(systemName: "arrow.left")  // Auto flips
Image(systemName: "arrow.leading")  // Semantic, doesn't flip
Image("arrow").flipsForRightToLeftLayoutDirection()
```

## Testing

```bash
# Scheme → Options → App Language: Choose language/region
# Double-Length Pseudolanguage: Tests truncation
# Right-to-Left Pseudolanguage: Tests RTL layout

# Export/import
xcodebuild -exportLocalizations -project MyApp.xcodeproj -localizationPath ./Localizations
xcodebuild -importLocalizations -project MyApp.xcodeproj -localizationPath ./Localizations/ja.xcloc
```

## Locale

```swift
let locale = Locale.current
print(locale.identifier)  // en_US
print(locale.language.languageCode)  // en

let languages = Locale.preferredLanguages  // ["en-US", "es-ES", "ja-JP"]
let currentLocalization = Bundle.main.preferredLocalizations.first
let available = Bundle.main.localizations  // ["en", "es", "ja", "de"]
```

## String Catalog Structure

```json
{
  "sourceLanguage": "en",
  "strings": {
    "Welcome": {
      "localizations": {
        "es": { "stringUnit": { "state": "translated", "value": "Bienvenido" } }
      }
    },
    "%lld points": {
      "localizations": {
        "en": {
          "variations": {
            "plural": {
              "one": { "stringUnit": { "value": "1 point" } },
              "other": { "stringUnit": { "value": "%lld points" } }
            }
          }
        }
      }
    }
  }
}
```

## Pitfalls

| Issue | Bad | Good |
|-------|-----|------|
| Hardcoded | `"Score: " + String(score)` | `String(localized: "Score: \(score)")` |
| Concatenation | `Text("Hello" + " " + name)` | `Text("Hello, \(name)")` |
| Fixed width | `.frame(width: 60)` | `.frame(minWidth: 60)` (German ~30% longer) |
| Manual format | `"\(score/1000)K"` | `.number.notation(.compactName)` |

## Decision Guide

| Choice | Use When |
|--------|----------|
| String Catalog | New projects (Xcode 15+) |
| .strings file | Legacy, third-party tools |
| Formatters | Numbers, dates, lists, measurements (always) |
| Locale-specific assets | Only when culturally necessary |

## MCP Integration

**Context7**: `/websites/developer_apple` - Search "String Catalog", "NSLocalizedString"

**Serena**: `find_file "*.xcstrings"` - Find String Catalogs; `search_for_pattern "LocalizedStringKey"` - Find localized strings

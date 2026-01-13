---
name: accessibility
description: Accessibility for Apple platforms - VoiceOver, Dynamic Type, focus management, accessibility labels. Triggers on a11y, screen reader, accessible.
---

# Accessibility

## SwiftUI

```swift
// Labels and hints
Button(action: playGame) { Image(systemName: "play.fill") }
    .accessibilityLabel("Play")
    .accessibilityHint("Starts a new game")

// Combined elements
HStack { Text("Score:"); Text("\(score)") }
    .accessibilityElement(children: .combine)
    .accessibilityLabel("Score: \(score)")

// Hide decorative
Image("decorative-border").accessibilityHidden(true)

// Custom actions
CardContent()
    .accessibilityAction(named: "Play") { startGame() }
    .accessibilityAction(named: "Add to Favorites") { addToFavorites() }

// Traits
Text("Game Title").accessibilityAddTraits(.isHeader)
Button("Select") { }.accessibilityAddTraits(.isSelected)
Text("Loading...").accessibilityAddTraits(.updatesFrequently)

// Value + adjustable
Slider(value: $volume, in: 0...100).accessibilityValue("\(Int(volume)) percent")
CustomSlider()
    .accessibilityValue("\(value)")
    .accessibilityAdjustableAction { direction in
        switch direction { case .increment: value += 10; case .decrement: value -= 10; @unknown default: break }
    }
```

## UIKit

```swift
class GameButton: UIButton {
    override func awakeFromNib() {
        super.awakeFromNib()
        isAccessibilityElement = true
        accessibilityLabel = "Play Game"
        accessibilityHint = "Double-tap to start playing"
        accessibilityTraits = .button
    }
}

// Container
class ScoreView: UIView {
    override var isAccessibilityElement: Bool { get { true } set { } }
    override var accessibilityLabel: String? { get { "\(titleLabel.text ?? ""): \(scoreLabel.text ?? "")" } set { } }
}

// Custom actions
override var accessibilityCustomActions: [UIAccessibilityCustomAction]? {
    get { [UIAccessibilityCustomAction(name: "Delete", target: self, selector: #selector(deleteAction))] }
    set { }
}
```

## VoiceOver

```swift
// Announcements
AccessibilityNotification.Announcement("Game Over").post()  // SwiftUI
UIAccessibility.post(notification: .announcement, argument: "Game Over")  // UIKit

// Screen/layout changed
UIAccessibility.post(notification: .screenChanged, argument: headerLabel)
UIAccessibility.post(notification: .layoutChanged, argument: nil)

// Check status
if UIAccessibility.isVoiceOverRunning { showAccessibleAlternative() }
NotificationCenter.default.addObserver(forName: UIAccessibility.voiceOverStatusDidChangeNotification, object: nil, queue: .main) { _ in }
```

## Dynamic Type

```swift
// SwiftUI - auto scales
Text("Title").font(.title)
Text("Custom").font(.custom("MyFont", size: 17, relativeTo: .body))
Text("Fixed").font(.system(size: 14)).dynamicTypeSize(.large)  // Locks size

// UIKit
label.font = UIFont.preferredFont(forTextStyle: .headline)
label.adjustsFontForContentSizeCategory = true

// Images
Image(systemName: "star.fill").imageScale(.large).accessibilityLabel("Favorite")
let config = UIImage.SymbolConfiguration(textStyle: .largeTitle)
imageView.image = UIImage(systemName: "star.fill", withConfiguration: config)
```

## tvOS Focus

```swift
// SwiftUI focus order
VStack { Button("First") { }; Button("Second") { } }
    .accessibilityFocused($isFocused)
    .accessibilitySortPriority(1)

// UIKit focus
class CustomFocusView: UIView {
    override var canBecomeFocused: Bool { true }
    override var accessibilityTraits: UIAccessibilityTraits { get { [.button] } set { } }
    override func didUpdateFocus(in context: UIFocusUpdateContext, with coordinator: UIFocusAnimationCoordinator) {
        super.didUpdateFocus(in: context, with: coordinator)
        if isFocused { UIAccessibility.post(notification: .layoutChanged, argument: self) }
    }
}
```

## Reduce Motion & Color

```swift
// Reduce motion
@Environment(\.accessibilityReduceMotion) var reduceMotion
CardView().animation(reduceMotion ? nil : .spring(), value: isExpanded)

// UIKit
if UIAccessibility.isReduceMotionEnabled { UIView.animate(withDuration: 0) { } }

// Differentiate without color
@Environment(\.accessibilityDifferentiateWithoutColor) var differentiateWithoutColor
if differentiateWithoutColor {
    HStack { Image(systemName: isActive ? "checkmark.circle" : "xmark.circle"); Text(isActive ? "Active" : "Inactive") }
} else { Circle().fill(isActive ? Color.green : Color.red) }
```

## Testing

```bash
# Accessibility Inspector: Xcode → Open Developer Tool → Accessibility Inspector
# VoiceOver: Cmd + F5 on simulator
```

```swift
// XCTest audit
func testAccessibility() throws {
    let app = XCUIApplication(); app.launch()
    try app.performAccessibilityAudit()
    try app.performAccessibilityAudit(for: [.dynamicType, .contrast])
}
```

## Pitfalls

| Issue | Bad | Good |
|-------|-----|------|
| Missing label | `Image("icon")` | `Image("icon").accessibilityLabel("Settings")` |
| Redundant | `.accessibilityLabel("Play button")` | `.accessibilityLabel("Play")` (trait=button) |
| Hidden focusable | `Button{}.opacity(0)` | `Button{}.opacity(0).accessibilityHidden(true)` |
| Low contrast | < 4.5:1 ratio | Use semantic colors: `.primary`, `.secondary` |

## MCP Integration

**Context7**: `/websites/developer_apple` - Search "accessibility VoiceOver", "Dynamic Type"

**Serena**: `search_for_pattern "accessibilityLabel"` - Find accessibility implementations

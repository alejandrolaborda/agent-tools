---
name: focus-engine
description: tvOS Focus Engine deep dive - UIFocusSystem, focus guides, custom focus behavior, programmatic focus control. Triggers on focus navigation, remote control, directional input, focus debugging.
---

# tvOS Focus Engine

## Core Concepts

- **UIFocusSystem**: Manages focus state across app
- **UIFocusEnvironment**: Container for focusable items (UIViewController, UIView)
- **UIFocusItem**: Element that can receive focus

Focus cycle: User input → `preferredFocusEnvironments` → `shouldUpdateFocus` → `didUpdateFocus`

## UIKit Focus APIs

```swift
class CustomVC: UIViewController {
    var preferredButton: UIButton!

    override var preferredFocusEnvironments: [UIFocusEnvironment] {
        [preferredButton, view]  // Priority order
    }

    override func shouldUpdateFocus(in context: UIFocusUpdateContext) -> Bool {
        !isAnimating  // Prevent focus during animation
    }

    override func didUpdateFocus(in context: UIFocusUpdateContext, with coordinator: UIFocusAnimationCoordinator) {
        coordinator.addCoordinatedAnimations({
            context.nextFocusedView?.transform = CGAffineTransform(scaleX: 1.1, y: 1.1)
            context.previouslyFocusedView?.transform = .identity
        }, completion: nil)
    }
}

// Programmatic focus
setNeedsFocusUpdate(); updateFocusIfNeeded()
UIFocusSystem(for: self)?.requestFocusUpdate(to: targetButton)
```

## Focus Guides

```swift
let focusGuide = UIFocusGuide()
view.addLayoutGuide(focusGuide)

// Position between elements (needs non-zero size!)
NSLayoutConstraint.activate([
    focusGuide.topAnchor.constraint(equalTo: leftColumn.topAnchor),
    focusGuide.bottomAnchor.constraint(equalTo: leftColumn.bottomAnchor),
    focusGuide.leadingAnchor.constraint(equalTo: leftColumn.trailingAnchor),
    focusGuide.trailingAnchor.constraint(equalTo: rightColumn.leadingAnchor),
    focusGuide.widthAnchor.constraint(greaterThanOrEqualToConstant: 1)  // Must have size!
])

// Dynamic target in didUpdateFocus
if context.previouslyFocusedView?.isDescendant(of: leftColumn) == true {
    focusGuide.preferredFocusEnvironments = [rightColumn.subviews.first!]
}
```

## Custom Focusable View

```swift
class FocusableCard: UIView {
    override var canBecomeFocused: Bool { true }

    override func didUpdateFocus(in context: UIFocusUpdateContext, with coordinator: UIFocusAnimationCoordinator) {
        coordinator.addCoordinatedAnimations({
            self.transform = self.isFocused ? CGAffineTransform(scaleX: 1.05, y: 1.05) : .identity
            self.layer.shadowOpacity = self.isFocused ? 0.3 : 0
        }, completion: nil)
    }
}
```

## SwiftUI Integration

```swift
@Namespace private var menuNamespace
@State private var selected: Option?

VStack {
    ForEach(Option.allCases) { opt in
        MenuButton(option: opt).focused($selected, equals: opt)
    }
}.focusScope(menuNamespace)
.onAppear { selected = .play }
```

## Debugging

```swift
// Enable in scheme arguments: -UIFocusLoggingEnabled YES
// Or: UserDefaults.standard.set(true, forKey: "UIFocusLoggingEnabled")

#if DEBUG
override func didUpdateFocus(in context: UIFocusUpdateContext, with coordinator: UIFocusAnimationCoordinator) {
    print("Focus: \(context.previouslyFocusedItem) → \(context.nextFocusedItem)")
}
#endif
```

## Common Issues

| Issue | Fix |
|-------|-----|
| Focus stuck | Add UIFocusGuide to bridge regions |
| Can't focus view | Override `canBecomeFocused` → true |
| Focus skips items | Check `preferredFocusEnvironments` |
| Focus lost on update | Call `setNeedsFocusUpdate()` |
| Guide not working | Ensure non-zero size constraints |

## Pitfalls

```swift
// Always return valid environments
override var preferredFocusEnvironments: [UIFocusEnvironment] {
    guard let p = preferred else { return [self] }  // Fallback!
    return [p]
}

// Defer focus after transitions
present(vc, animated: true) {
    DispatchQueue.main.async { vc.setNeedsFocusUpdate(); vc.updateFocusIfNeeded() }
}

// Use coordinated animations
coordinator.addCoordinatedAnimations({ /* sync with focus */ }, completion: nil)
// NOT: UIView.animate { /* conflicts */ }
```

## MCP Integration

**Context7**: `/websites/developer_apple` - Query "UIFocusSystem", "UIFocusGuide", "focus engine"

**Serena**: `find_symbol "UIFocusEnvironment"` - Focus containers; `search_for_pattern "canBecomeFocused"` - Custom focusable views

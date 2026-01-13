---
name: swiftui-tvos
description: SwiftUI for tvOS with focus system, navigation, Siri Remote gestures. Triggers on tvOS UI, focus, TabView, remote control, Apple TV interface, directional navigation.
---

# SwiftUI for tvOS

## Focus System

```swift
// @FocusState
struct LoginView: View {
    enum Field { case username, password }
    @FocusState private var focus: Field?
    var body: some View {
        VStack {
            TextField("Username", text: $username).focused($focus, equals: .username)
            SecureField("Password", text: $password).focused($focus, equals: .password)
            Button("Login") { focus = nil }
        }
    }
}

// focusable() - make non-interactive view focusable
Text("Label").focusable().onFocusChange { focused in print(focused) }

// focusSection() - enable directional focus into container
HStack {
    VStack { Button("1") {}; Button("2") {} }
    VStack { Button("A") {}; Button("B") {} }.focusSection()
}

// Default focus
@Namespace private var ns
VStack {
    Button("Play") {}.prefersDefaultFocus(in: ns)
    Button("Settings") {}
}.focusScope(ns)

// Reset focus
@Environment(\.resetFocus) var resetFocus
func restart() { resetFocus(in: ns) }
```

## Navigation

```swift
// TabView with sidebar
TabView(selection: $tab) {
    HomeView().tabItem { Label("Home", systemImage: "house") }.tag(Tab.home)
    SearchView().tabItem { Label("Search", systemImage: "magnifyingglass") }.tag(Tab.search)
}.tabViewStyle(.sidebarAdaptable)

// NavigationStack
NavigationStack(path: $path) {
    List(items) { item in NavigationLink(value: item) { ItemRow(item: item) } }
    .navigationDestination(for: Item.self) { DetailView(item: $0) }
}
```

## Siri Remote Commands

```swift
// D-pad
.onMoveCommand { dir in
    switch dir {
    case .up: move(-1); case .down: move(1)
    case .left: back(); case .right: details()
    @unknown default: break
    }
}

// Play/Pause & Exit
.onPlayPauseCommand { isPlaying.toggle() }
.onExitCommand { if isFullscreen { exit() } else { dismiss() } }

// Long press
Button("Delete") {}.onLongPressGesture(minimumDuration: 1.0) { quickDelete() }
```

## Button Styles

```swift
Button { } label: { VStack { Image(...); Text(title) } }
    .buttonStyle(.card)  // Liquid glass, no padding

Button("Action") {}
    .buttonBorderShape(.roundedRectangle)
    .hoverEffect(.highlight)  // Lift + specular

// Custom focus scale
@Environment(\.isFocused) var isFocused
CardContent().scaleEffect(isFocused ? 1.1 : 1.0).animation(.easeInOut(duration: 0.2), value: isFocused)
```

## Layout

```swift
// Safe area (60px padding minimum for overscan)
VStack { }.padding(.all, 60)

// Horizontal grid
ScrollView(.horizontal) {
    LazyHStack(spacing: 40) {
        ForEach(items) { NavigationLink(value: $0) { ItemCard(item: $0) }.buttonStyle(.card) }
    }.padding(.horizontal, 60)
}.focusSection()

// Content shelf (Netflix-style)
VStack(alignment: .leading) {
    Text(title).font(.headline).padding(.leading, 60)
    ScrollView(.horizontal) {
        LazyHStack(spacing: 30) { ForEach(items) { ItemCard(item: $0) } }.padding(.horizontal, 60)
    }.focusSection()
}
```

## Common Pitfalls

```swift
// Focus loss - always have focusable content
if showOverlay { OverlayView().focusSection() }

// Exit command - handle context
.onExitCommand {
    if hasUnsaved { showConfirm = true }
    else if navDepth > 0 { back() }
    else { dismiss() }
}

// Button style - use .card, don't break focus
.buttonStyle(.card).overlay { CustomDecoration() }
```

## MCP Integration

**Context7**: `/websites/developer_apple_swiftui` - SwiftUI docs (13515 snippets). Query "focus tvOS", "@FocusState", "focusSection"

**Serena**: `find_symbol "@FocusState"` - Find focus usage; `search_for_pattern "focusable()"` - Focus implementations

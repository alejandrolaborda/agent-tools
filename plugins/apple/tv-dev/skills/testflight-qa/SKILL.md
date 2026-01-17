---
name: testflight-qa
description: Testing and QA for tvOS - XCUITest with remote simulation, screenshots, navigation tracking, TestFlight distribution. Triggers on testing, XCUITest, TestFlight, QA, automation, screenshots, beta testing.
---

# Testing & QA for tvOS

## XCUITest Setup

```swift
import XCTest

class MyAppUITests: XCTestCase {
    var app: XCUIApplication!
    var remote: XCUIRemote!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        remote = XCUIRemote.shared
        app.launch()
    }

    override func tearDownWithError() throws {
        if testRun?.hasBeenSkipped == false && testRun?.hasSucceeded == false {
            takeScreenshot(name: "failure_\(name)")
        }
    }
}
```

## Remote Control Simulation

```swift
let remote = XCUIRemote.shared

// Navigation
remote.press(.up); remote.press(.down); remote.press(.left); remote.press(.right)

// Actions
remote.press(.select)      // Click
remote.press(.menu)        // Back
remote.press(.playPause)   // Play/pause
remote.press(.select, forDuration: 2.0)  // Long press

// Navigate to element
func navigateToElement(_ element: XCUIElement, direction: XCUIRemote.Button, maxAttempts: Int = 20) -> Bool {
    var attempts = 0
    while !element.hasFocus && attempts < maxAttempts {
        remote.press(direction)
        usleep(300_000)  // 300ms for focus animation
        attempts += 1
    }
    return element.hasFocus
}
```

## Screenshots

```swift
extension XCTestCase {
    func takeScreenshot(name: String) {
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func takeScreenshot(of element: XCUIElement, name: String) {
        let attachment = XCTAttachment(screenshot: element.screenshot())
        attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
    }
}
```

## Navigation Tracking

```swift
class ScreenFlowTests: XCTestCase {
    var navigationPath: [String] = []
    var visitedScreens: [(name: String, screenshot: String)] = []

    func navigateAndRecord(to element: XCUIElement, screenName: String) {
        XCTAssertTrue(navigateToElement(element, direction: .down))
        remote.press(.select)
        navigationPath.append(screenName)
        let screenshotName = "screen_\(visitedScreens.count)_\(screenName)"
        takeScreenshot(name: screenshotName)
        visitedScreens.append((screenName, screenshotName))
        sleep(1)
    }

    func goBack() {
        remote.press(.menu)
        if !navigationPath.isEmpty { navigationPath.removeLast() }
        sleep(1)
    }

    var focusedElement: XCUIElement? {
        app.descendants(matching: .any).matching(NSPredicate(format: "hasFocus == true")).firstMatch
    }
}
```

## Element Queries

```swift
let button = app.buttons["play_button"]           // By identifier
let settings = app.buttons["Settings"]            // By label
let focused = app.descendants(matching: .any).matching(NSPredicate(format: "hasFocus == true")).firstMatch
let cells = app.collectionViews.firstMatch.cells

func waitForElement(_ element: XCUIElement, timeout: TimeInterval = 10) -> Bool {
    element.waitForExistence(timeout: timeout)
}
```

## Test Patterns

```swift
func testMainMenuNavigation() throws {
    takeScreenshot(name: "main_menu")
    let playButton = app.buttons["Play"]
    XCTAssertTrue(navigateToElement(playButton, direction: .down))
    remote.press(.select); sleep(1)
    takeScreenshot(name: "game_screen")
    remote.press(.menu); sleep(1)
    takeScreenshot(name: "back_to_menu")
}

func testLaunchPerformance() throws {
    measure(metrics: [XCTApplicationLaunchMetric()]) { XCUIApplication().launch() }
}
```

## TestFlight Distribution

**Internal**: Upload via Xcode → ASC TestFlight → Add internal testers (100 max)
**External**: Submit for Beta Review → Create group → Add testers via email/link (10,000 max, 90 days)

```bash
# Simulator commands
xcrun simctl list devices | grep -i tvos
xcrun simctl boot "Apple TV 4K (3rd generation)"
xcrun simctl io booted screenshot ~/Desktop/screenshot.png
xcrun simctl io booted recordVideo ~/Desktop/test.mov
```

## CI (GitHub Actions)

```yaml
name: tvOS Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - run: sudo xcode-select -s /Applications/Xcode_16.app
      - run: xcodebuild test -project MyApp.xcodeproj -scheme MyAppUITests -destination 'platform=tvOS Simulator,name=Apple TV 4K (3rd generation)' -resultBundlePath TestResults
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: test-results, path: TestResults }
```

## Common Pitfalls

```swift
// Wait for focus animation
remote.press(.down)
usleep(300_000)  // Required!
XCTAssertTrue(element.hasFocus)

// Wait for screen transition
remote.press(.select)
sleep(1)  // Required before screenshot
takeScreenshot(name: "new_screen")

// Compare elements by identifier, not object
if element1.identifier == element2.identifier { }
```

## MCP Integration

**Context7**: `/websites/developer_apple` - Query "XCUITest tvOS", "XCUIRemote", "TestFlight"

**Serena**: `find_file "*UITests.swift"` - Test files; `search_for_pattern "XCUIRemote"` - Remote simulation code

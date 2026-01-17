---
name: app-store-review
description: App Store Review Guidelines compliance - rejection prevention, safety, performance, business, design, legal requirements. Triggers on rejection, guidelines, compliance, submission.
---

# App Store Review Guidelines

## Top Rejections

| Rank | Guideline | Issue | Fix |
|------|-----------|-------|-----|
| 1 | 2.1 | App Completeness | Test all features, no crashes, no placeholders |
| 2 | 4.0 | Design/metadata | Accurate screenshots/descriptions |
| 3 | 2.3 | Accurate Metadata | Match app to listing |
| 4 | 5.1.1 | Data Collection | Clear privacy labels |
| 5 | 3.1.1 | In-App Purchase | Use StoreKit, no external links |

## 1. Safety

**1.1 Objectionable Content**: No offensive content. UGC requires moderation.

**1.2 User-Generated Content** (required): Content filter, block/report users, developer contact, hide objectionable content.

**1.3 Kids Category**: No external links, no behavioral ads, parental gate for purchases, COPPA compliance.

## 2. Performance

**2.1 App Completeness** (~40% rejections):
- No crashes on launch
- All features functional
- No placeholder content
- Demo account for reviewers
- Backend operational

**2.3 Accurate Metadata**: Screenshots match app, description accurate, no competitor names.

**2.5 SDK Requirements (2025)**: iOS 18 SDK, tvOS 18 SDK, watchOS 11 SDK, visionOS 2 SDK.

```xml
<!-- Info.plist capabilities -->
<key>UIRequiredDeviceCapabilities</key>
<array><string>arm64</string></array>
```

## 3. Business

**3.1.1 In-App Purchase Required** for digital content, subscriptions, game currency, unlocking features.

```swift
// Correct: StoreKit
Product.products(for: ["premium_subscription"])

// Wrong: External payment
URL(string: "https://mysite.com/buy")  // Rejected!

// Required: Restore purchases button
Button("Restore Purchases") { Task { try await AppStore.sync() } }

// Required: Subscription management link
UIApplication.shared.open(URL(string: "https://apps.apple.com/account/subscriptions")!)
```

## 4. Design

**4.2 Minimum Functionality**: Must provide value, no web-view-only wrappers.

**4.5 Apple Sites**: Don't simulate system UI, no fake alerts.

```swift
Alert(title: "iOS System")  // Rejected!
Alert(title: "Game Name")   // Good
```

## 5. Legal

**5.1.1 Data Collection**: Privacy Nutrition Labels required. Declare all data, explain usage, link privacy policy.

```swift
import AppTrackingTransparency
ATTrackingManager.requestTrackingAuthorization { status in }
```

**5.2 IP**: Own or license all content, proper attribution.

**5.3 Gambling**: Real-money requires licenses, simulated (coins) allowed with age gate.

## tvOS Specific

- All interactive elements focusable with clear indicators
- Siri Remote as primary controller
- MFi controller optional with consistent mapping
- Use TVServices for TV provider auth

## Submission Checklist

**App Info**: Name ≤30 chars unique, subtitle, privacy/support URLs work.

**Media**: Screenshots 1920x1080 showing actual app, no device frames.

**Review Info**: Demo account if login required, notes for special features.

**Legal**: Age rating complete, export compliance, privacy labels accurate.

## Common Mistakes

```swift
// Crashes
let user = currentUser!  // Bad
guard let user = currentUser else { showLoginScreen(); return }  // Good

// Privacy
<key>NSCameraUsageDescription</key>
<string>Used for profile photos</string>

// URLs
let privacyURL = "http://localhost:3000/privacy"  // Bad
let privacyURL = "https://myapp.com/privacy"  // Good
```

## Rejection Response

If rejected:
1. Read reason carefully
2. Fix specific issue
3. Reply in Resolution Center with details
4. Provide demo account/additional context
5. Request phone call if needed
6. Appeal to App Review Board as last resort

## Age Rating

| Rating | Content |
|--------|---------|
| 4+ | No objectionable |
| 9+ | Mild cartoon violence |
| 12+ | Frequent violence |
| 17+ | Mature themes |

## MCP Integration

**Context7**: `/websites/developer_apple` - Search "App Store Review Guidelines", "rejection"

**Serena**: `search_for_pattern "NSUserTrackingUsageDescription"` - Find privacy declarations

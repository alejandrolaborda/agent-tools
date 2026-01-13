---
name: gamekit
description: Game Center integration - achievements, leaderboards, matchmaking, multiplayer. Triggers on Game Center, achievements, leaderboards, scores, matchmaking, multiplayer, GKLocalPlayer, GKAchievement.
---

# GameKit & Game Center

## Setup

1. Xcode → Target → Signing & Capabilities → + Game Center
2. App Store Connect → App → Services → Game Center → Enable
3. Configure leaderboards/achievements in ASC

```swift
import GameKit

// Authentication
GKLocalPlayer.local.authenticateHandler = { vc, error in
    if let vc = vc {
        self.present(vc, animated: true)
    } else if GKLocalPlayer.local.isAuthenticated {
        print("Authenticated: \(GKLocalPlayer.local.displayName)")
    }
}
```

## Achievements

Max 100 achievements, 100 pts each, 1000 total pts per game.

```swift
func reportAchievement(id: String, percent: Double) {
    let achievement = GKAchievement(identifier: id)
    achievement.percentComplete = percent
    achievement.showsCompletionBanner = true
    GKAchievement.report([achievement]) { error in
        if let e = error { print("Error: \(e)") }
    }
}

// Unlock
reportAchievement(id: "first_win", percent: 100.0)

// Progress
reportAchievement(id: "collect_100", percent: 45.0)

// Load player progress
GKAchievement.loadAchievements { achievements, _ in
    achievements?.forEach { print("\($0.identifier): \($0.percentComplete)%") }
}

#if DEBUG
GKAchievement.resetAchievements { _ in } // Debug reset
#endif
```

## Leaderboards

Classic (permanent) or Recurring (daily/weekly reset).

```swift
// Submit score
GKLeaderboard.submitScore(1500, context: 0, player: GKLocalPlayer.local, leaderboardIDs: ["high_scores"]) { error in }

// Load top scores
GKLeaderboard.loadLeaderboards(IDs: ["high_scores"]) { lbs, _ in
    lbs?.first?.loadEntries(for: .global, timeScope: .allTime, range: NSRange(1...10)) { local, entries, _, _ in
        entries?.forEach { print("#\($0.rank): \($0.player.displayName) - \($0.score)") }
        if let l = local { print("You: #\(l.rank)") }
    }
}
```

## Multiplayer

```swift
// Match request
let request = GKMatchRequest()
request.minPlayers = 2; request.maxPlayers = 4

// UI matchmaking
let matchVC = GKMatchmakerViewController(matchRequest: request)!
matchVC.matchmakerDelegate = self
present(matchVC, animated: true)

// Auto-match (no UI)
GKMatchmaker.shared().findMatch(for: request) { match, _ in
    if let m = match { self.startGame(with: m) }
}

// Send data
try match.sendData(toAllPlayers: data, with: .reliable)

// GKMatchDelegate
func match(_ match: GKMatch, didReceive data: Data, fromRemotePlayer player: GKPlayer) {
    processGameData(data, from: player)
}

// Turn-based
GKTurnBasedMatch.find(for: request) { match, _ in }
match.endTurn(withNextParticipants: nextPlayers, turnTimeout: GKTurnTimeoutDefault, match: gameData) { _ in }
```

## Game Center UI

```swift
// Access Point (floating button)
GKAccessPoint.shared.location = .topLeading
GKAccessPoint.shared.isActive = true

// Dashboard
present(GKGameCenterViewController(state: .dashboard), animated: true)

// Specific leaderboard
present(GKGameCenterViewController(leaderboardID: "high_scores", playerScope: .global, timeScope: .allTime), animated: true)
```

## Saved Games (iCloud)

```swift
// Save
GKLocalPlayer.local.saveGameData(data, withName: "save1") { savedGame, _ in }

// Load
GKLocalPlayer.local.fetchSavedGames { games, _ in
    games?.first?.loadData { data, _ in self.restore(from: data!) }
}
```

## Common Pitfalls

```swift
// Always check auth
guard GKLocalPlayer.local.isAuthenticated else { return }

// Sandbox ≠ production (achievements don't carry over)
// Use context for score tiebreakers
GKLeaderboard.submitScore(score, context: timestamp, player: GKLocalPlayer.local, leaderboardIDs: ["lb"])
```

## MCP Integration

**Context7**: `/websites/developer_apple` - Query "Game Center", "GKAchievement", "GKLeaderboard"

**Serena**: `find_symbol "GKLocalPlayer"` - Auth code; `search_for_pattern "Game Center"` - GameKit implementations

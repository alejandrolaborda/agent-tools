---
name: avkit-media
description: Video/audio playback with AVKit, AVPlayer, HLS streaming, Picture-in-Picture, transport bar customization. Triggers on video, audio, playback, streaming, HLS, AVPlayer, media, AVKit.
---

# AVKit Media Playback

## Basic Setup

```swift
import AVKit

// SwiftUI
struct VideoView: View {
    let player = AVPlayer(url: URL(string: "https://example.com/video.m3u8")!)
    var body: some View {
        VideoPlayer(player: player)
            .onAppear { player.play() }
            .onDisappear { player.pause() }
    }
}

// UIKit
func playVideo(url: URL) {
    let player = AVPlayer(url: url)
    let playerVC = AVPlayerViewController()
    playerVC.player = player
    present(playerVC, animated: true) { player.play() }
}
```

## HLS Streaming & Observers

```swift
let player = AVPlayer(url: URL(string: "https://example.com/playlist.m3u8")!)

// Status observer
var statusObserver: NSKeyValueObservation?
statusObserver = player.observe(\.status) { player, _ in
    switch player.status {
    case .readyToPlay: print("Ready")
    case .failed: print("Error: \(player.error?.localizedDescription ?? "")")
    case .unknown: print("Loading")
    @unknown default: break
    }
}

// Time observer (remove in deinit!)
var timeObserver: Any?
timeObserver = player.addPeriodicTimeObserver(forInterval: CMTime(seconds: 1, preferredTimescale: 1), queue: .main) { time in
    print("Time: \(CMTimeGetSeconds(time))")
}
// deinit: player.removeTimeObserver(timeObserver!)
```

## tvOS Info Panel (External Metadata)

```swift
func configureMetadata(for item: AVPlayerItem, title: String, desc: String, artwork: UIImage?) {
    var metadata: [AVMetadataItem] = []

    let titleItem = AVMutableMetadataItem()
    titleItem.identifier = .commonIdentifierTitle; titleItem.value = title as NSString
    metadata.append(titleItem)

    let descItem = AVMutableMetadataItem()
    descItem.identifier = .commonIdentifierDescription; descItem.value = desc as NSString
    metadata.append(descItem)

    if let artwork = artwork, let data = artwork.pngData() {
        let artItem = AVMutableMetadataItem()
        artItem.identifier = .commonIdentifierArtwork; artItem.value = data as NSData
        artItem.dataType = kCMMetadataBaseDataType_PNG as String
        metadata.append(artItem)
    }

    item.externalMetadata = metadata  // Set BEFORE assigning to player
}
```

## Transport Bar Customization

```swift
// Custom menu items
let favoriteAction = UIAction(title: "Add to Favorites", image: UIImage(systemName: "heart")) { _ in
    self.addToFavorites()
}
let speedMenu = UIMenu(title: "Speed", children: [
    UIAction(title: "0.5x") { _ in self.player.rate = 0.5 },
    UIAction(title: "1x", state: .on) { _ in self.player.rate = 1.0 },
    UIAction(title: "2x") { _ in self.player.rate = 2.0 }
])
playerVC.transportBarCustomMenuItems = [favoriteAction, speedMenu]

// Contextual actions (Skip Intro)
func showSkipIntro(skipTo: CMTime) {
    playerVC.contextualActions = [UIAction(title: "Skip Intro") { [weak self] _ in
        self?.player.seek(to: skipTo)
        self?.playerVC.contextualActions = []
    }]
}

// Disable title view
playerVC.transportBarIncludesTitleView = false

// Custom info tabs
playerVC.customInfoViewControllers = [RecommendedVC(), CastVC()]

// Custom overlay (swipe up to reveal)
playerVC.customOverlayViewController = CustomOverlayVC()
```

## Chapter Markers

```swift
func addChapters(to item: AVPlayerItem, chapters: [(title: String, start: Double, end: Double)]) {
    let markers = chapters.map { ch -> AVTimedMetadataGroup in
        let titleItem = AVMutableMetadataItem()
        titleItem.identifier = .commonIdentifierTitle; titleItem.value = ch.title as NSString
        return AVTimedMetadataGroup(items: [titleItem], timeRange: CMTimeRange(
            start: CMTime(seconds: ch.start, preferredTimescale: 1),
            end: CMTime(seconds: ch.end, preferredTimescale: 1)
        ))
    }
    item.navigationMarkerGroups = [AVNavigationMarkersGroup(title: "Chapters", timedNavigationMarkers: markers)]
}
```

## Picture-in-Picture

```swift
// 1. Enable: Signing & Capabilities → Background Modes → Audio, AirPlay, PiP
// 2. Audio session
try AVAudioSession.sharedInstance().setCategory(.playback, mode: .moviePlayback)
try AVAudioSession.sharedInstance().setActive(true)
// 3. Enable
playerVC.allowsPictureInPicturePlayback = true

// Delegate
func playerViewController(_ pvc: AVPlayerViewController, restoreUserInterfaceForPictureInPictureStopWithCompletionHandler handler: @escaping (Bool) -> Void) {
    present(pvc, animated: true) { handler(true) }
}
```

## Audio Sessions

```swift
// Video playback
try AVAudioSession.sharedInstance().setCategory(.playback, mode: .moviePlayback)

// Ambient (splash screens, won't interrupt other audio)
try AVAudioSession.sharedInstance().setCategory(.ambient, options: .duckOthers)
```

## Resume Playback

```swift
func playFromPosition(url: URL, position: TimeInterval) {
    let item = AVPlayerItem(url: url)
    item.seek(to: CMTime(seconds: position, preferredTimescale: 1), completionHandler: nil)
    let player = AVPlayer(playerItem: item)
    playerVC.player = player
    present(playerVC, animated: true) { player.play() }
}

// Save position
UserDefaults.standard.set(CMTimeGetSeconds(player.currentTime()), forKey: "pos_\(videoID)")
```

## Common Pitfalls

```swift
// Set metadata BEFORE player assignment
item.externalMetadata = metadata
player.replaceCurrentItem(with: item)
playerVC.player = player

// Async asset loading
let asset = AVAsset(url: url)
Task { let duration = try await asset.load(.duration) }  // Not asset.duration (blocks)

// Remove time observers
deinit { if let obs = timeObserver { player.removeTimeObserver(obs) } }
```

## MCP Integration

**Context7**: `/websites/developer_apple` - Query "AVPlayerViewController tvOS", "HLS streaming", "transport bar"

**Serena**: `find_symbol "AVPlayerViewController"` - Player setup; `search_for_pattern "externalMetadata"` - Info panel config

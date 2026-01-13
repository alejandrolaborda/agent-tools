---
name: uikit-tvos
description: UIKit and TVUIKit for tvOS - UICollectionView, TVPosterView, TVMonogramView, compositional layouts, focus management. Triggers on UIKit, TVUIKit, UICollectionView, carousel, poster, lockup, tvOS UIKit.
---

# UIKit & TVUIKit for tvOS

## TVUIKit Components

```swift
import TVUIKit

// TVPosterView - Image + title + subtitle
class PosterCell: UICollectionViewCell {
    let posterView = TVPosterView()
    override init(frame: CGRect) {
        super.init(frame: frame)
        contentView.addSubview(posterView)
        posterView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            posterView.topAnchor.constraint(equalTo: contentView.topAnchor),
            posterView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            posterView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            posterView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor)
        ])
    }
    func configure(image: UIImage?, title: String, subtitle: String?) {
        posterView.image = image; posterView.title = title; posterView.subtitle = subtitle
    }
    required init?(coder: NSCoder) { fatalError() }
}

// TVMonogramView - Circular image/initials for people
class PersonCell: UICollectionViewCell {
    let monogramView = TVMonogramView()
    func configure(image: UIImage?, name: String) {
        monogramView.image = image; monogramView.title = name
        if image == nil { monogramView.personNameComponents = PersonNameComponents(givenName: name) }
    }
}

// TVCardView - Expandable card container
// TVCaptionButtonView - Button with image + caption
```

## Compositional Layout

```swift
// Horizontal carousel
func createCarouselLayout() -> UICollectionViewCompositionalLayout {
    let item = NSCollectionLayoutItem(layoutSize: NSCollectionLayoutSize(widthDimension: .absolute(300), heightDimension: .absolute(450)))
    item.contentInsets = NSDirectionalEdgeInsets(top: 0, leading: 10, bottom: 0, trailing: 10)
    let group = NSCollectionLayoutGroup.horizontal(layoutSize: NSCollectionLayoutSize(widthDimension: .absolute(300), heightDimension: .absolute(450)), subitems: [item])
    let section = NSCollectionLayoutSection(group: group)
    section.orthogonalScrollingBehavior = .continuous
    section.contentInsets = NSDirectionalEdgeInsets(top: 20, leading: 60, bottom: 20, trailing: 60)
    return UICollectionViewCompositionalLayout(section: section)
}

// Multi-section (Netflix-style) with headers
func createMultiSectionLayout() -> UICollectionViewCompositionalLayout {
    UICollectionViewCompositionalLayout { sectionIndex, env in
        let item = NSCollectionLayoutItem(layoutSize: NSCollectionLayoutSize(widthDimension: .absolute(300), heightDimension: .fractionalHeight(1.0)))
        let group = NSCollectionLayoutGroup.horizontal(layoutSize: NSCollectionLayoutSize(widthDimension: .absolute(300), heightDimension: .absolute(200)), subitems: [item])
        let section = NSCollectionLayoutSection(group: group)
        section.orthogonalScrollingBehavior = .continuous
        section.contentInsets = NSDirectionalEdgeInsets(top: 10, leading: 60, bottom: 30, trailing: 60)
        let header = NSCollectionLayoutBoundarySupplementaryItem(layoutSize: NSCollectionLayoutSize(widthDimension: .fractionalWidth(1.0), heightDimension: .absolute(50)), elementKind: UICollectionView.elementKindSectionHeader, alignment: .top)
        section.boundarySupplementaryItems = [header]
        return section
    }
}
```

## Focus Management

```swift
// Cell focus effect
class FocusableCell: UICollectionViewCell {
    override func didUpdateFocus(in context: UIFocusUpdateContext, with coordinator: UIFocusAnimationCoordinator) {
        coordinator.addCoordinatedAnimations({
            self.transform = self.isFocused ? CGAffineTransform(scaleX: 1.1, y: 1.1) : .identity
            self.layer.shadowOpacity = self.isFocused ? 0.3 : 0
        }, completion: nil)
    }
}

// Built-in image focus effect
imageView.adjustsImageWhenAncestorFocused = true

// Container that shouldn't steal focus
class ContainerCell: UICollectionViewCell {
    override var canBecomeFocused: Bool { false }
}

// Remember focus position
class GridVC: UIViewController {
    var lastFocusedIndexPath: IndexPath?
    override var preferredFocusEnvironments: [UIFocusEnvironment] {
        if let ip = lastFocusedIndexPath, let cell = collectionView.cellForItem(at: ip) { return [cell] }
        return [collectionView]
    }
}
```

## Diffable Data Source

```swift
enum Section: Hashable { case featured, trending }
struct Item: Hashable { let id: UUID; let title: String }

var dataSource: UICollectionViewDiffableDataSource<Section, Item>!

func configureDataSource() {
    let cellReg = UICollectionView.CellRegistration<PosterCell, Item> { cell, indexPath, item in
        cell.configure(title: item.title)
    }
    dataSource = UICollectionViewDiffableDataSource(collectionView: collectionView) { cv, ip, item in
        cv.dequeueConfiguredReusableCell(using: cellReg, for: ip, item: item)
    }
}

func applySnapshot() {
    var snapshot = NSDiffableDataSourceSnapshot<Section, Item>()
    snapshot.appendSections([.featured, .trending])
    snapshot.appendItems(featuredItems, toSection: .featured)
    dataSource.apply(snapshot, animatingDifferences: true) // Focus-safe animations
}

// AVOID: collectionView.reloadData() breaks focus
```

## Content Configurations (tvOS 15+)

```swift
var config = TVMediaItemContentConfiguration.wideCell()
config.image = posterImage; config.text = title; config.secondaryText = subtitle
config.badgeText = "NEW"; config.playbackProgress = 0.5
contentConfiguration = config
```

## Safe Area

```swift
// tvOS 60px top/bottom, 90px left/right for overscan
collectionView.contentInset = UIEdgeInsets(top: 60, left: 90, bottom: 60, right: 90)
```

## MCP Integration

**Context7**: `/websites/developer_apple` - Query "TVUIKit", "UICollectionView tvOS", "compositional layout"

**Serena**: `find_symbol "TVPosterView"` - TV components; `search_for_pattern "UIFocusGuide"` - Focus guides

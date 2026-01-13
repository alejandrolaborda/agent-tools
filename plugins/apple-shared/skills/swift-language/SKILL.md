---
name: swift-language
description: Swift 6.2 expert for iOS/macOS/server. Triggers on Swift, async/await, actors, Sendable, SPM, protocols, generics, optionals, ARC, Swift Testing, macros, Codable, Regex, performance.
license: Apache-2.0
compatibility: Swift 6.0+, Xcode 16+
metadata:
  version: "1.0"
  target-software-version: "6.2.3"
  last-updated: "2026-01-12"
  docs-source: "swift.org, developer.apple.com"
---

# Swift 6.2 Expert

## Concurrency

### Actors
```swift
actor BankAccount {
    private var balance: Decimal = 0
    func deposit(_ amount: Decimal) { balance += amount }
    func withdraw(_ amount: Decimal) throws -> Decimal {
        guard balance >= amount else { throw BankError.insufficientFunds }
        balance -= amount
        return amount
    }
}

@MainActor
class ViewModel: ObservableObject {
    @Published var items: [Item] = []
    func refresh() async { items = await fetchItems() }
}
```

### Async/Await
```swift
func fetchUser(id: Int) async throws -> User {
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(User.self, from: data)
}

// Parallel with async let
async let user = fetchUser(id: 1)
async let posts = fetchPosts()
let data = try await (user, posts)

// Dynamic with TaskGroup
func fetchAll(ids: [Int]) async throws -> [User] {
    try await withThrowingTaskGroup(of: User.self) { group in
        for id in ids { group.addTask { try await fetchUser(id: id) } }
        return try await group.reduce(into: []) { $0.append($1) }
    }
}
```

### Sendable
```swift
struct UserData: Sendable { let id: Int; let name: String }

final class ThreadSafeCache: @unchecked Sendable {
    private let lock = NSLock()
    private var storage: [String: Any] = [:]
    func get(_ key: String) -> Any? {
        lock.lock(); defer { lock.unlock() }
        return storage[key]
    }
}
```

## Error Handling

```swift
enum ValidationError: Error, LocalizedError {
    case invalidEmail
    case passwordTooShort(minimum: Int)
    var errorDescription: String? {
        switch self {
        case .invalidEmail: return "Invalid email"
        case .passwordTooShort(let min): return "Min \(min) chars"
        }
    }
}

func validate(_ user: UserInput) throws {
    guard user.email.contains("@") else { throw ValidationError.invalidEmail }
    guard user.password.count >= 8 else { throw ValidationError.passwordTooShort(minimum: 8) }
}

// Result for deferred handling
let result = Result { try riskyOperation() }
let value = try result.get()
```

## Protocols & Generics

```swift
protocol Repository {
    associatedtype Entity: Identifiable
    func fetch(id: Entity.ID) async throws -> Entity?
    func save(_ entity: Entity) async throws
}

extension Repository {
    func fetchAll(ids: [Entity.ID]) async throws -> [Entity] {
        try await withThrowingTaskGroup(of: Entity?.self) { group in
            for id in ids { group.addTask { try await fetch(id: id) } }
            return try await group.compactMap { $0 }.reduce(into: []) { $0.append($1) }
        }
    }
}

func findDuplicates<T: Hashable>(in array: [T]) -> Set<T> {
    var seen = Set<T>(), duplicates = Set<T>()
    for el in array { if seen.contains(el) { duplicates.insert(el) } else { seen.insert(el) } }
    return duplicates
}

// some vs any
func makeShape() -> some Shape { Circle() }      // Single concrete type
func makeAny() -> any Shape { Circle() }         // Any conforming type
```

## Memory (ARC)

```swift
class Parent { var child: Child? }
class Child { weak var parent: Parent? }

class ViewController {
    func setup() {
        onComplete = { [weak self] in
            guard let self else { return }
            self.handleCompletion()
        }
    }
}

class CreditCard {
    unowned let customer: Customer  // Only when lifetime guaranteed
}
```

## Swift Package Manager

```swift
// swift-tools-version: 6.0
let package = Package(
    name: "MyLib",
    platforms: [.macOS(.v14), .iOS(.v17)],
    products: [.library(name: "MyLib", targets: ["MyLib"])],
    dependencies: [
        .package(url: "https://github.com/apple/swift-async-algorithms", from: "1.0.0")
    ],
    targets: [
        .target(name: "MyLib", dependencies: [
            .product(name: "AsyncAlgorithms", package: "swift-async-algorithms")
        ]),
        .testTarget(name: "MyLibTests", dependencies: ["MyLib"])
    ]
)
```

## Swift 6.2 Features

```swift
// InlineArray - stack allocated, no ARC
var buffer: InlineArray<64, UInt8> = .init(repeating: 0)

// Span - safe memory access, ~400% faster for algorithms
func process(_ span: Span<Int>) { for v in span { print(v) } }

// Default MainActor isolation
nonisolated func pureComputation(_ x: Int) -> Int { x * 2 }
```

## Swift Testing

```swift
import Testing

@Test func addition() {
    #expect(2 + 2 == 4)
}

@Test func async() async throws {
    let data = try await fetchData()
    #expect(data.count > 0)
}

@Suite("Auth")
struct AuthTests {
    @Test func login() async throws {
        let result = try await auth.login(user: "test", pass: "pass")
        #expect(result.isAuthenticated)
    }
}

@Test("Emails", arguments: ["a@b.com", "test@x.org"])
func validEmail(_ email: String) { #expect(EmailValidator.isValid(email)) }

@Test(.enabled(if: FeatureFlags.new)) func conditional() { }
@Test(.timeLimit(.minutes(1))) func limited() async { }

@Test func unwrap() async throws {
    let user = try #require(await fetchUser(id: 1))
    #expect(user.name == "Alice")
}
```

## Macros

```swift
@Observable
class Settings {
    var theme: Theme = .light
    var fontSize: Int = 14
}

withObservationTracking { print(settings.theme) } onChange: { print("Changed") }

@OptionSet<UInt8>
struct Permissions {
    private enum Options: Int { case read, write, execute }
}

#warning("TODO: Implement")
#error("Unsupported platform")

// Custom macro
@freestanding(expression)
public macro stringify<T>(_ value: T) -> (T, String) =
    #externalMacro(module: "MyMacros", type: "StringifyMacro")
```

## Codable

```swift
struct User: Codable { let id: Int; let name: String; let createdAt: Date }

let encoder = JSONEncoder()
encoder.dateEncodingStrategy = .iso8601
let data = try encoder.encode(user)

let decoder = JSONDecoder()
decoder.keyDecodingStrategy = .convertFromSnakeCase
let user = try decoder.decode(User.self, from: data)

// Custom keys
struct Product: Codable {
    let productName: String
    enum CodingKeys: String, CodingKey { case productName = "product_name" }
}

// Nested JSON
struct Response: Decodable {
    let name: String
    enum CodingKeys: String, CodingKey { case user }
    enum UserKeys: String, CodingKey { case profile }
    enum ProfileKeys: String, CodingKey { case name }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let u = try c.nestedContainer(keyedBy: UserKeys.self, forKey: .user)
        let p = try u.nestedContainer(keyedBy: ProfileKeys.self, forKey: .profile)
        name = try p.decode(String.self, forKey: .name)
    }
}
```

## Regex

```swift
let phone = /\d{3}-\d{3}-\d{4}/
let date = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/
if let m = "2024-01-15".firstMatch(of: date) { print(m.year) }

import RegexBuilder
let email = Regex {
    OneOrMore(.word); "@"; OneOrMore(.word); "."; Repeat(2...6) { .word }
}

text.replacing(email, with: "[REDACTED]")
text.matches(of: email)
```

## Performance

### Memory
```swift
// Prefer structs (stack) over classes (heap)
struct Point { var x, y: Double }

// COW for custom types
struct LargeData {
    private var ref: Ref<[Double]>
    var data: [Double] {
        get { ref.value }
        set {
            if !isKnownUniquelyReferenced(&ref) { ref = Ref(newValue) }
            else { ref.value = newValue }
        }
    }
}

// Closures: weak self
fetchData { [weak self] r in self?.handle(r) }
```

### CPU
```swift
// Reserve capacity
var results: [Item] = []
results.reserveCapacity(1000)

// Lazy for chains
largeArray.lazy.filter { $0.isValid }.map { $0.transform() }.prefix(10)

// Set for O(1) lookup
let idSet = Set(ids)
idSet.contains(id)

// final for devirtualization
final class Service { }
```

### Network
```swift
// Reuse URLSession
static let session: URLSession = {
    let c = URLSessionConfiguration.default
    c.timeoutIntervalForRequest = 30
    c.waitsForConnectivity = true
    return URLSession(configuration: c)
}()

// Cache
let cache = URLCache(memoryCapacity: 20_000_000, diskCapacity: 100_000_000)
request.cachePolicy = .returnCacheDataElseLoad

// Retry with backoff
for attempt in 0..<3 {
    do { return try await fetch(url) }
    catch { try await Task.sleep(for: .seconds(pow(2.0, Double(attempt)))) }
}
```

### Profiling
- Time Profiler: CPU hotspots
- Allocations: memory usage
- Leaks: retain cycles
- Network: request timing
- Hangs: main thread blocking

## Pitfalls

### Force Unwrap
```swift
// Bad: user.name!
// Good: guard let name = user.name else { return }
// Good: user.name ?? "Anonymous"
```

### Retain Cycles
```swift
// Bad: onComplete = { self.doSomething() }
// Good: onComplete = { [weak self] in self?.doSomething() }
```

### Main Thread
```swift
// Bad: Task { await fetch(); tableView.reloadData() }
// Good: Task { await fetch(); await MainActor.run { tableView.reloadData() } }
```

### String Indices
```swift
let emoji = "👨‍👩‍👧‍👦"
emoji.count  // 1
emoji.unicodeScalars.count  // 7
emoji.utf8.count  // 25
```

### Collection Mutation
```swift
// Bad: for (i, n) in nums.enumerated() { if cond { nums.remove(at: i) } }
// Good: nums.removeAll { cond }
```

### Floating Point
```swift
// Bad: 0.1 + 0.2 == 0.3  // false
// Good: abs(a - b) < 1e-10
// Money: Decimal(string: "19.99")!
```

### Actor Reentrancy
```swift
// Bad: guard balance >= amount else { return }; await log(); balance -= amount
// Good: check -> mutate -> await (no suspension in critical section)
```

### Lazy Thread Safety
```swift
// lazy var is NOT thread-safe, use actor for thread-safe lazy init
```

## Decision Guide

### Type Selection
- Fixed cases → enum
- No identity needed → struct
- Concurrent access → actor
- Identity/inheritance → class

### Error Handling
- Not found (valid) → Optional
- Need error details → throws
- Deferred handling → Result

### Concurrency
- Fixed count, different types → async let
- Dynamic count → TaskGroup

### References
- May become nil → weak
- Guaranteed lifetime → unowned
- Default → weak

### Protocols
- Same concrete type → some
- Different types → any

### Collections
- Ordered, duplicates OK → Array
- Fast lookup, unique → Set
- Key-value → Dictionary

### Unwrapping
- Need value after → guard let
- Scoped use → if let

## MCP Integration

Query Context7 for Swift docs:
- Library: /swiftlang/swift
- Use for: API signatures, latest syntax

Use Serena for code navigation:
- find_symbol: locate types/functions
- find_referencing_symbols: find usages
- get_symbols_overview: file structure

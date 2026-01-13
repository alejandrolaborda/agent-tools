---
name: swift-language
description: Swift 6.2 expert - async/await, actors, Sendable, SPM, protocols, generics, optionals, ARC, Swift Testing, macros, Codable, Regex, performance.
---

# Swift 6.2

## Concurrency

```swift
// Actor isolation
actor BankAccount {
    private var balance: Decimal = 0
    func deposit(_ amount: Decimal) { balance += amount }
    func withdraw(_ amount: Decimal) throws -> Decimal {
        guard balance >= amount else { throw BankError.insufficientFunds }
        balance -= amount; return amount
    }
}

@MainActor class ViewModel: ObservableObject {
    @Published var items: [Item] = []
    func refresh() async { items = await fetchItems() }
}

// Async/await
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

// Sendable
struct UserData: Sendable { let id: Int; let name: String }
final class ThreadSafeCache: @unchecked Sendable {
    private let lock = NSLock()
    private var storage: [String: Any] = [:]
    func get(_ key: String) -> Any? { lock.lock(); defer { lock.unlock() }; return storage[key] }
}
```

## Error Handling

```swift
enum ValidationError: Error, LocalizedError {
    case invalidEmail, passwordTooShort(minimum: Int)
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

let result = Result { try riskyOperation() }  // Deferred handling
```

## Protocols & Generics

```swift
protocol Repository {
    associatedtype Entity: Identifiable
    func fetch(id: Entity.ID) async throws -> Entity?
    func save(_ entity: Entity) async throws
}

func findDuplicates<T: Hashable>(in array: [T]) -> Set<T> {
    var seen = Set<T>(), duplicates = Set<T>()
    for el in array { if seen.contains(el) { duplicates.insert(el) } else { seen.insert(el) } }
    return duplicates
}

func makeShape() -> some Shape { Circle() }  // Single concrete type
func makeAny() -> any Shape { Circle() }     // Any conforming type
```

## Memory (ARC)

```swift
class Parent { var child: Child? }
class Child { weak var parent: Parent? }  // Break cycle

class ViewController {
    func setup() {
        onComplete = { [weak self] in self?.handleCompletion() }  // Capture list
    }
}

class CreditCard { unowned let customer: Customer }  // Guaranteed lifetime only
```

## SPM

```swift
// swift-tools-version: 6.0
let package = Package(
    name: "MyLib",
    platforms: [.macOS(.v14), .iOS(.v17)],
    products: [.library(name: "MyLib", targets: ["MyLib"])],
    dependencies: [.package(url: "https://github.com/apple/swift-async-algorithms", from: "1.0.0")],
    targets: [
        .target(name: "MyLib", dependencies: [.product(name: "AsyncAlgorithms", package: "swift-async-algorithms")]),
        .testTarget(name: "MyLibTests", dependencies: ["MyLib"])
    ]
)
```

## Swift 6.2 Features

```swift
var buffer: InlineArray<64, UInt8> = .init(repeating: 0)  // Stack allocated
func process(_ span: Span<Int>) { for v in span { print(v) } }  // ~400% faster
nonisolated func pureComputation(_ x: Int) -> Int { x * 2 }  // Default MainActor isolation
```

## Swift Testing

```swift
import Testing

@Test func addition() { #expect(2 + 2 == 4) }
@Test func async() async throws { let data = try await fetchData(); #expect(data.count > 0) }

@Suite("Auth") struct AuthTests {
    @Test func login() async throws {
        let result = try await auth.login(user: "test", pass: "pass")
        #expect(result.isAuthenticated)
    }
}

@Test("Emails", arguments: ["a@b.com", "test@x.org"])
func validEmail(_ email: String) { #expect(EmailValidator.isValid(email)) }

@Test(.enabled(if: FeatureFlags.new)) func conditional() { }
@Test(.timeLimit(.minutes(1))) func limited() async { }
@Test func unwrap() async throws { let user = try #require(await fetchUser(id: 1)); #expect(user.name == "Alice") }
```

## Macros & Codable

```swift
@Observable class Settings { var theme: Theme = .light; var fontSize: Int = 14 }
withObservationTracking { print(settings.theme) } onChange: { print("Changed") }

@OptionSet<UInt8> struct Permissions { private enum Options: Int { case read, write, execute } }

// Codable
struct User: Codable { let id: Int; let name: String; let createdAt: Date }
let encoder = JSONEncoder(); encoder.dateEncodingStrategy = .iso8601
let decoder = JSONDecoder(); decoder.keyDecodingStrategy = .convertFromSnakeCase

// Custom keys
struct Product: Codable {
    let productName: String
    enum CodingKeys: String, CodingKey { case productName = "product_name" }
}
```

## Regex

```swift
let phone = /\d{3}-\d{3}-\d{4}/
let date = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/
if let m = "2024-01-15".firstMatch(of: date) { print(m.year) }

import RegexBuilder
let email = Regex { OneOrMore(.word); "@"; OneOrMore(.word); "."; Repeat(2...6) { .word } }
text.replacing(email, with: "[REDACTED]")
```

## Performance

```swift
// Memory: Prefer structs (stack), COW for large data
struct LargeData {
    private var ref: Ref<[Double]>
    var data: [Double] {
        get { ref.value }
        set { if !isKnownUniquelyReferenced(&ref) { ref = Ref(newValue) } else { ref.value = newValue } }
    }
}

// CPU: reserveCapacity, lazy chains, Set for O(1), final classes
var results: [Item] = []; results.reserveCapacity(1000)
largeArray.lazy.filter { $0.isValid }.map { $0.transform() }.prefix(10)
let idSet = Set(ids); idSet.contains(id)
final class Service { }

// Network: Reuse URLSession, cache, retry with backoff
static let session: URLSession = { let c = URLSessionConfiguration.default; c.timeoutIntervalForRequest = 30; return URLSession(configuration: c) }()
```

## Pitfalls

| Issue | Bad | Good |
|-------|-----|------|
| Force unwrap | `user.name!` | `guard let name = user.name else { return }` |
| Retain cycle | `{ self.doSomething() }` | `{ [weak self] in self?.doSomething() }` |
| Main thread | `Task { await fetch(); tableView.reloadData() }` | `Task { await fetch(); await MainActor.run { tableView.reloadData() } }` |
| String index | `emoji[0]` | `emoji.first` (grapheme clusters) |
| Collection mutation | `for (i,n) in nums.enumerated() { nums.remove(at:i) }` | `nums.removeAll { cond }` |
| Floats | `0.1 + 0.2 == 0.3` | `abs(a-b) < 1e-10` or `Decimal` |
| Actor reentrancy | check→await→mutate | check→mutate→await |

## Decision Guide

| Choice | Use When |
|--------|----------|
| enum | Fixed cases |
| struct | No identity needed |
| actor | Concurrent access |
| class | Identity/inheritance |
| Optional | Not found (valid) |
| throws | Need error details |
| Result | Deferred handling |
| async let | Fixed count parallel |
| TaskGroup | Dynamic count |
| weak | May become nil |
| unowned | Guaranteed lifetime |
| some | Same concrete type |
| any | Different types |

## MCP Integration

**Context7** - Query latest Swift documentation:
- `/swiftlang/swift` - Swift language (3181 snippets)
- `/websites/developer_apple` - Apple developer docs (97955 snippets)

**Serena** - Code navigation:
- `find_symbol` - Locate types/functions by name
- `find_referencing_symbols` - Find usages
- `get_symbols_overview` - File structure overview

# Performance and object lifetime (digest)

Read the digest after a profile shows a cost, or when a retain cycle or a `deinit` that
runs at an unexpected time needs fixing. Don't apply the rules to code you have not
measured, because most of them make code harder to read.

## Order of work

```text
1. Check the algorithm.    Find the complexity of each call inside a loop.
2. Profile.                Run Instruments on a test that exercises the slow path.
3. Read the profile.       Match the top symbols to the table below.
4. Change one thing.       Profile again, and keep the change only if the time fell.
```

| Symbol at the top of the profile | Meaning | Usual fix |
|---|---|---|
| `platform_memmove` | values are being copied | pass a `Span`, or reserve capacity once |
| `swift_allocObject`, `malloc` | many short lived heap allocations | remove intermediate arrays, or use `InlineArray` |
| `swift_retain`, `swift_release` | reference counting on class instances | store values, or pass a `Span` |
| `swift_beginAccess` | run time exclusivity checks on class properties | move the properties into a struct |
| a protocol witness or `swift_getGenericMetadata` | unspecialized generic or `any P` code | use `some P`, or add `@specialized` |

## Algorithms first

| Slow form | Cost | Faster form | Cost |
|---|---|---|---|
| `remove(at:)` on an `Array` inside a loop | O(n²) | `removeAll(where:)` | O(n) |
| `array.contains(x)` inside a loop | O(n²) | build a `Set` once | O(n) |
| `data = data.dropFirst()` per byte | O(n²) | `popFirst()` on a slice, or an index | O(n) |
| `map`, then `filter`, then `map` on a large array | one new array per step | one loop that writes into a reserved array, or `lazy` | one array |
| `string.count` or `string[index]` in a loop | O(n) per call | iterate once, or use `utf8` | O(1) per step |

## Value and reference costs

- A struct is stored inline, and a class instance is stored on the heap. Copying a struct
  with three class properties costs three retains, and copying a class reference costs
  one.
- An `any P` value has room for three words inline. A larger value is allocated on the
  heap for each copy, so `[any Shape]` is slower than `[Circle]`.
- Mark a class `final` when nothing inherits from it, so calls to its methods can be
  inlined.
- A hop to another actor costs a context switch. Pass a whole array to one call on the
  actor, and don't call the actor once per element.

## Copy before a write

A struct can store its data in a private class instance and still behave as a value.
Before each write, the struct checks whether another struct refers to the same instance,
and it copies the instance if so. `Array`, `String`, and `Dictionary` work the same way.
Use the pattern for a large struct that is copied often, because a copy then costs one
retain.

```swift
final class Texture {
  var color: String
  init(color: String) { self.color = color }
}

struct Material {
  var roughness: Double
  private var texture: Texture

  init(roughness: Double, color: String) {
    self.roughness = roughness
    self.texture = Texture(color: color)
  }

  var color: String {
    get { texture.color }
    set {
      if !isKnownUniquelyReferenced(&texture) { texture = Texture(color: newValue) }
      texture.color = newValue
    }
  }
}
```

## Fixed size storage and spans

`InlineArray<N, Element>` stores its elements inline with no heap allocation. Use it for
a small buffer whose size never changes, and don't use it for a value you copy often. A
`Span` gives direct access to contiguous storage, and the compiler prevents it from
outliving the collection it came from.

```swift
struct Histogram {
  var buckets: InlineArray<4, Int> = [0, 0, 0, 0]

  mutating func record(_ bytes: Span<UInt8>) {
    for index in bytes.indices {
      buckets[Int(bytes[index] >> 6)] += 1
    }
  }
}

func histogram(of data: [UInt8]) -> Histogram {
  var result = Histogram()
  result.record(data.span)
  return result
}
```

Swift 6.3 added `@specialized(where T == Int)`, which makes the compiler emit a fast copy
of a generic function for one concrete type. Swift 6.4 added `UniqueArray`, a
noncopyable array that never performs a hidden copy.

## Object lifetime

Swift may release an object right after its last use, which can be before the closing
brace. The moment a `deinit` runs can change between compiler versions and optimization
levels, so code must not depend on it.

| Problem | Fix |
|---|---|
| Two objects hold each other strongly | make the reference from child to parent `weak` |
| A stored closure captures `self`, and `self` stores the closure | capture `[weak self]`, and exit early when `self` is `nil` |
| A `weak` reference is `nil` earlier than expected | keep a strong reference in the owner, and don't add `withExtendedLifetime` in many places |
| A `deinit` sends a metric or changes global state | do the work in a `defer` at the call site |

```swift
final class Folder {
  var files: [File] = []
}

final class File {
  weak var folder: Folder?
  let name: String
  init(name: String, folder: Folder) {
    self.name = name
    self.folder = folder
  }
}

final class Poller {
  private var onTick: (() -> Void)?
  private(set) var ticks = 0

  func start() {
    onTick = { [weak self] in
      guard let self else { return }
      ticks += 1
    }
  }
}
```

Use `weak` or `unowned` only to break a cycle. The better fix is often to remove the
cycle, e.g., by moving the data both objects need into a third object that both refer to.
In Xcode, the Memory Graph debugger and the Leaks instrument show which objects form a
cycle.

# Unsafe code and interop (digest)

Read the digest when the code calls C, C++, or Objective-C, or when it uses a pointer.

An unsafe API is one that cannot check its own preconditions, so a wrong call causes
undefined behavior. A safe API that traps on a bad index is still safe, because the
program stops before it reads memory it should not read.

## Choosing an API

| Need | Use | Not |
|---|---|---|
| Read the elements of an array quickly | `array.span` | `withUnsafeBufferPointer` |
| Read raw bytes | `data.bytes` or `array.span.bytes`, which return a `RawSpan` | `withUnsafeBytes` |
| Fill a new buffer | `Array(capacity:)` with a closure that appends to an `OutputSpan` | `UnsafeMutablePointer.allocate` |
| Parse a binary format | the Swift Binary Parsing package | pointer arithmetic |
| Pass a buffer to a C function | `withUnsafeBufferPointer`, inside the smallest scope | a stored pointer |

## Strict memory safety

Turn on strict memory safety in a module that handles untrusted input. The compiler then
warns about each unsafe operation until the expression is marked `unsafe`, so a
reviewer can search for the word and audit each place. Write a comment above each
`unsafe` that says why the preconditions hold.

```swift
// flags: -strict-memory-safety
func checksum(_ bytes: [UInt8]) -> UInt32 {
  var sum: UInt32 = 0
  // The pointer is used only inside the closure, and `count` comes from the buffer.
  bytes.withUnsafeBufferPointer { buffer in
    for index in 0..<buffer.count {
      sum &+= UInt32(unsafe buffer[index])
    }
  }
  return sum
}
```

In a package, add `.strictMemorySafety()` to the target's `swiftSettings`. Since Swift
6.4 you can also write `@diagnose(StrictMemorySafety, as: error)` on one declaration.

## Rules for pointers

- Keep the pointer inside the closure that provides it. Never return it or store it.
- Use a buffer pointer, which carries a count, and not a bare pointer.
- Wrap the unsafe code in one small type with a safe API, and keep the rest of the
  module free of `unsafe`.
- Run the tests with the Address Sanitizer, `swift test --sanitize=address`.

## Calling C, and being called from C

Swift imports C, Objective-C, and C++ declarations directly, so add Swift to an existing
project one file at a time and don't rewrite the project. A C function that takes a
pointer and a count is imported with a `Span` parameter when its header has bounds
annotations such as `__counted_by`.

Since Swift 6.3, `@c` exports a Swift function to C. Use fixed width integer types in
the signature.

```swift
@c(shop_add)
func add(_ a: Int32, _ b: Int32) -> Int32 {
  a &+ b
}
```

| C or C++ | Swift |
|---|---|
| `T *` that may be null | `UnsafePointer<T>?`, and check for `nil` before use |
| a `create` and `destroy` pair | a `~Copyable` struct, or a `final class`, that calls `destroy` in `deinit` |
| an error code return | a function that `throws` an error `enum` with one case per code |
| `const char *` | `String(cString:)` to read, and `withCString` to pass |
| a C++ type that can only be moved | a `~Copyable` type |

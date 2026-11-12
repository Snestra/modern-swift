---
name: swift-port
description: >-
  Port code from TypeScript, JavaScript, Python, or Kotlin into modern Swift that keeps
  the original behavior: enums in place of string unions and sealed classes, optionals in
  place of null and None, thrown error enums in place of exception hierarchies, structs
  in place of dicts and data classes, and ported tests that prove the match. Use for
  port, translate, convert, migrate, or rewrite requests ("rewrite this in Swift", "what
  would this look like in Swift"), even if the user doesn't say "port".
---

# Swift port

The goal is the Swift a Swift developer would have written for the same problem, with the
same observable behavior. A line by line translation compiles, but it keeps the shapes
the original language forced, e.g., a class that only groups functions or a dictionary
used as a record. Port the behavior and design the structure again.

```text
port(source)
  1. understand the original and list its observable behavior
  2. port the tests
  3. design the Swift API, then implement it
  4. keep the port in proportion to the original
  5. verify
  6. write PORTING.md
```

## 1. Understand the original before you write Swift

First, read the code, its tests, and its callers if you have them. Second, list the
observable behavior, which is every public function with its inputs, its outputs, and
each way it can fail. Third, mark what is incidental, which is anything the original
does only because of its language.

| Observable, so keep it | Incidental, so drop it |
|---|---|
| The order of results, and how ties are broken | A class that exists only to hold static functions |
| The result for empty input | `isinstance` or `typeof` checks on a value whose type is now fixed |
| Which inputs are errors, and the data each error carries | A null check on a value that is no longer optional |
| Whitespace, case, and Unicode handling | Defensive copies of arrays and objects, because Swift arrays are values |
| The exact text of output and of error messages callers match on | A callback parameter that existed only because the code is asynchronous |

If the original has a bug or an ambiguity, keep its behavior, record it in the porting
notes, and let the user decide. Don't fix behavior silently in a port.

## 2. Port the tests first

Translate the original tests into Swift Testing before you port the implementation. Keep
one Swift test for each original test, with a name that maps back to the original, so a
reader can check coverage. A table driven test or a set of subtests becomes one
`@Test(arguments:)`. If the original has no tests, write tests from the behavior list in
step 1. If the user's instructions say not to write tests, skip the step, and verify in
step 5 by running both versions on the same inputs.

## 3. Design the Swift API, then implement it

Choose the public types and signatures from the behavior list, and not from the shape of
the original. Then implement against the ported tests. Follow `swift-best-practices` for
the style of the Swift, if the skill is installed.

### From TypeScript and JavaScript

| In the original | In Swift |
|---|---|
| A union of string literals, `"build" \| "test"` | An `enum` with `String` raw values, and `init?(rawValue:)` to parse |
| A discriminated union, `{ kind: "ok", value } \| { kind: "err", message }` | An `enum` with associated values |
| `interface` or object type used as a record | A `struct` with `let` properties |
| `interface` used for polymorphism | A `protocol`, used as `some P` |
| `T \| null \| undefined`, optional chaining, `??` | `T?`, optional chaining, `??`. Use one `nil` for both `null` and `undefined` unless the two differ in behavior |
| `number` | `Int` or `Double`, chosen on purpose for each value |
| `throw new SomeError(...)`, `try` and `catch` | An error `enum`, `throws`, `do` and `catch` |
| `Promise<T>`, `async` and `await` | `async throws -> T` |
| `Promise.all([a(), b()])` | `async let`, or a task group for a list |
| `Map` or a plain object, when iteration order is observable | An array of pairs, or `OrderedDictionary` from swift-collections. `Dictionary` has no stable order |
| `array.map`, `filter`, `reduce`, `find`, `some`, `every` | `map`, `filter`, `reduce`, `first(where:)`, `contains(where:)`, `allSatisfy` |
| `readonly` fields, `Object.freeze` | `let` properties on a struct |
| A class with only static members, a module of functions | Free functions, or a caseless `enum` as a namespace |
| `JSON.parse` into a typed object | A `Codable` struct with `JSONDecoder` |
| `any`, `unknown` with type guards | A concrete type or an `enum`. Avoid `Any` |

### From Python

| In the original | In Swift |
|---|---|
| An exception hierarchy | One error `enum` with one case per exception class. Attributes become associated values |
| `None` as a value | `T?` |
| Strings used as a closed set, `kind in ("build", "test")` | An `enum` with `String` raw values |
| A `dict` or a `@dataclass` used as a record | A `struct`, with `Equatable` and `Hashable` synthesized |
| `dict` iteration order, which is insertion order | An array of pairs, or `OrderedDictionary`. A plain `Dictionary` changes the output order |
| Duck typing, `isinstance` | A `protocol`, or an `enum` |
| Unbounded `int` | `Int`, which traps on overflow. Use `addingReportingOverflow` where input can be large |
| `sorted(items, key=...)`, which is stable | `sorted(by:)`, which does not promise a stable order. Add the original index as a second key when ties are observable |
| A generator with `yield` | A type that conforms to `Sequence`, or an `AsyncStream` |
| `with open(...) as f` | `defer`, or a function that takes a closure |
| `try` and `except ValueError` around a parse | A failable initializer such as `Int(text)`, with `guard let` |
| A default argument that is a mutable object | A default value. Swift evaluates the default on each call |
| `a // b` and `a % b`, which round down | `/` and `%`, which round toward zero. The results differ when one operand is negative |

### From Kotlin

| In the original | In Swift |
|---|---|
| `data class` | A `struct` |
| `sealed class` or `sealed interface` with `when` | An `enum` with associated values and `switch` |
| `T?`, `?.`, `?:`, `!!` | `T?`, `?.`, `??`, and never `!` on input |
| `suspend fun`, `coroutineScope` with `async` | An `async` function, `async let` or a task group |
| `Flow<T>` | An `AsyncSequence`, e.g., `AsyncStream<T>` |
| `object` singleton, `companion object` | A `static let`, static members |
| `lateinit var` | A `let` set in `init`, or an optional |
| `Int` arithmetic, which wraps on overflow | `Int` traps on overflow. Use `&+` only where wrapping is the behavior |
| `mapOf` and `LinkedHashMap`, which keep insertion order | An array of pairs, or `OrderedDictionary` |
| Extension functions, scope functions such as `let` and `apply` | Extensions, `if let`, and plain statements |

### Text functions that differ

String functions cause most silent differences in a port, so check each one against the
original on empty input and on repeated separators.

| Original | Swift | Difference to check |
|---|---|---|
| `"a,,b".split(",")` gives three parts | `split(separator: ",")` gives two parts | pass `omittingEmptySubsequences: false` to keep empty parts |
| Python `text.split()` | `split(whereSeparator: \.isWhitespace)` | both drop empty parts |
| Python `len(s)`, JavaScript `s.length` | `s.count` | Swift counts user visible characters, Python counts code points, and JavaScript counts UTF-16 units |
| `s[i]` | `s[s.index(s.startIndex, offsetBy: i)]`, which is O(n) | convert to `Array(s)` once when the code indexes often |
| `strip()`, `trim()` | `trimmingCharacters(in: .whitespacesAndNewlines)` from Foundation | the sets of whitespace characters differ on rare Unicode input |
| `splitlines()` | `split(whereSeparator: \.isNewline)` | Swift treats `"\r\n"` as one character, and `omittingEmptySubsequences` controls blank lines |
| `lower()`, `toLowerCase()` | `lowercased()` | results match for ASCII |

### Example

The Python original raises one of two exceptions, and it compares `kind` to string
literals. The Swift port uses an `enum` for each closed set, and each error carries its
data.

```python
class UnknownKind(Exception): ...
class MissingField(Exception): ...

def parse(row: dict) -> tuple[str, int | None]:
    if "kind" not in row:
        raise MissingField("kind")
    if row["kind"] not in ("build", "test"):
        raise UnknownKind(row["kind"])
    return row["kind"], row.get("priority")
```

```swift
enum Kind: String {
  case build, test
}

enum ParseError: Error, Equatable {
  case missingField(String)
  case unknownKind(String)
}

struct Step: Equatable {
  let kind: Kind
  let priority: Int?
}

func parse(_ row: [String: String]) throws(ParseError) -> Step {
  guard let text = row["kind"] else { throw .missingField("kind") }
  guard let kind = Kind(rawValue: text) else { throw .unknownKind(text) }
  return Step(kind: kind, priority: row["priority"].flatMap { Int($0) })
}
```

## 4. Keep the port in proportion

- Don't reimplement the source language's runtime. Use Swift's `split`, `Int(_:)`, and
  `lowercased()`, and not hand written copies of Python's or JavaScript's versions. Where
  Swift differs only on rare input, such as Unicode digits or integers beyond 64 bits,
  list the difference in the porting notes. Write a compatibility function only when the
  user says such input occurs.
- Don't grow the API. Port the public operations the original has, and add the
  conformances Swift callers expect, e.g., `Equatable`, `Hashable`, `Sendable`,
  `CustomStringConvertible`, and `Codable` where the original serializes. Don't add
  builders, protocols with one conforming type, or generic parameters.
- Keep the algorithm unless it is wrong. Change it only to fix a problem such as
  quadratic time on realistic input, and say so in the notes.
- Check the size. Count code lines without tests and comments. A port from TypeScript or
  Kotlin usually lands near the original's size, and a port from Python lands at up to
  twice the original because types and error enums are explicit. A larger port usually
  shows one of the three habits above.

## 5. Verify

Run the commands below if a Swift toolchain is available, and fix everything they report.

```bash
swift build
swift test
swift format lint --recursive Sources Tests
```

Every ported test must pass. If you can run the original, run both versions on a few
dozen realistic and edge case inputs and compare the output.

## 6. Write the porting notes

Write a short `PORTING.md` next to the code that a reviewer can check in a few minutes.

| Section | Content |
|---|---|
| API mapping | a table from each original function or type to its Swift equivalent |
| Test mapping | each original test and the Swift test that covers it |
| Deliberate differences | behavior that changed and the reason, e.g., an integer that now traps on overflow |
| Preserved quirks | odd behavior kept on purpose, so nobody removes it by accident |
| Verification | the commands you ran and their results, or a statement that you could not run them |

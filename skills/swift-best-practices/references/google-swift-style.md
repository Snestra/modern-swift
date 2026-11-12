# Google Swift Style Guide (digest)

Source: https://google.github.io/swift/ . Read the digest for a formatting or file
layout question that `swift format` does not settle. Where the Google guide and the
Swift API Design Guidelines disagree on naming, follow the API Design Guidelines. The
Google guide predates Swift concurrency, so it has no rules about actors or `Sendable`.

## Files

| Topic | Rule |
|---|---|
| File name | A file with one type is named for the type, e.g., `MyType.swift`. A file that adds a conformance is named `MyType+MyProtocol.swift`. |
| Imports | Import the whole module, e.g., `import Foundation`. Sort imports, and put `@testable` imports last. |
| Order | Put declarations in an order a reader can explain, and separate groups with `// MARK:` comments. |
| Overloads | Keep overloads of one name next to each other with nothing in between. |
| Extensions | Use an extension to group the members that satisfy one protocol. |

## Formatting

`swift format` applies most of the rules below, so run the formatter and don't apply the
rules by hand.

- Indent with two spaces, and keep lines within 100 columns.
- Put the opening brace on the same line as the declaration, and write one statement
  per line with no semicolons.
- Write `[Element]`, `[Key: Value]`, and `Element?`, and not `Array<Element>`,
  `Dictionary<Key, Value>`, or `Optional<Element>`.
- Add a trailing comma after the last element of a collection literal that spans lines.

## Programming practices

| Rule | Write | Not |
|---|---|---|
| Let the compiler create the memberwise initializer | `struct Point { var x, y: Double }` | a hand written `init(x:y:)` that only assigns |
| Omit `get` in a read only computed property | `var area: Double { width * height }` | `var area: Double { get { ... } }` |
| Give each enum case its own line unless no case has a value | `case north, south` for plain cases | several cases with payloads on one line |
| Use a caseless `enum` as a namespace | `enum Constants { static let limit = 10 }` | a struct with a private `init` |
| Use one trailing closure only | `Timer.schedule(after: 1) { tick() }` | a trailing closure when two closures are passed |
| Put the pattern's `let` on each binding | `case .failed(let error)` | `case let .failed(error)` |
| Exit early with `guard` | `guard let user else { return }` | nesting the main path inside `if let` |
| Use `for` with `where` for a filter | `for item in items where item.isActive` | an `if` as the only statement in the loop |
| Write a literal with a type annotation | `let x: UInt8 = 3` | `let x = UInt8(3)` |

- Don't force unwrap, force cast, or use an implicitly unwrapped optional outside test
  code, unless the line has a comment that states why the value cannot be `nil`.
- Declare the access level on each member, and not on the extension that holds them.
- Define an operator only when it has a known meaning in the problem domain.
- Use `fallthrough` only when two cases share code and one case also needs its own step.

## Documentation

Use `///` and not `/** */`. Write a one sentence summary, then a blank `///` line, then
details. Use `- Parameters:` with a nested list when a function has two or more
parameters, and `- Parameter name:` when it has one.

# Swift API Design Guidelines (digest)

Source: https://www.swift.org/documentation/api-design-guidelines/ . Read the digest when
you name or document a public declaration. The guidelines put clarity at the place of
use above brevity, because code is read at many call sites and declared once.

## Naming

| Guideline | Write | Not |
|---|---|---|
| Include each word a reader needs to avoid ambiguity | `employees.remove(at: index)` | `employees.remove(index)` |
| Omit words that repeat type information | `allViews.remove(cancelButton)` | `allViews.removeElement(cancelButton)` |
| Name a variable or parameter for its role, not its type | `var greeting: String` | `var string: String` |
| Add a noun when the type is weak, e.g., `Any` or `Int` | `addObserver(_:forKeyPath:)` | `add(_:for:)` |
| Make a call read as an English phrase | `x.insert(y, at: z)` | `x.insert(y, position: z)` |
| Start a factory method with `make` | `x.makeIterator()` | `x.iterator()` |
| Don't join the first argument to the base name of an initializer | `Color(red: 32, green: 64, blue: 128)` | `Color(havingRGBValuesRed: 32, ...)` |

Name a function for its side effects. A function without side effects reads as a noun
phrase, e.g., `x.distance(to: y)`. A function with side effects reads as an imperative
verb, e.g., `x.sort()`.

Name the two forms of one operation as a pair. When the operation is a verb, the
mutating form is the verb and the other form adds "ed" or "ing". When the operation is a
noun, the other form is the noun and the mutating form adds "form".

| Mutating | Returns a new value |
|---|---|
| `x.sort()` | `x.sorted()` |
| `x.append(y)` | `x.appending(y)` |
| `y.formUnion(z)` | `y.union(z)` |

A Boolean property or method reads as an assertion about the receiver, e.g., `x.isEmpty`
or `line1.intersects(line2)`. A protocol that describes what a value is uses a noun, e.g.,
`Collection`. A protocol that describes a capability ends in `able`, `ible`, or `ing`,
e.g., `Equatable` or `ProgressReporting`.

Types and protocols use `UpperCamelCase`, and everything else uses `lowerCamelCase`. An
acronym keeps one case throughout, e.g., `utf8Bytes`, `isRepresentableAsASCII`, and
`HTTPClient`.

## Argument labels

| Case | Rule | Example |
|---|---|---|
| The arguments cannot be told apart | Omit all labels | `min(number1, number2)` |
| An initializer converts a value and keeps its meaning | Omit the first label | `Int64(someUInt32)` |
| The first argument is part of a prepositional phrase | Label it with the preposition | `x.removeBoxes(havingLength: 12)` |
| The first argument completes a grammatical phrase | Omit its label | `x.addSubview(y)` |
| Any other argument | Label it | `x.dismiss(animated: false)` |

Give a parameter a default value when one value is used most often, and put parameters
with defaults at the end of the list.

## Documentation comments

Write a `///` comment for every public declaration. Start with a summary that is one
sentence fragment and ends with a period. The first word depends on the declaration.

| Declaration | The summary says | Example |
|---|---|---|
| Function or method | what it does and what it returns | `/// Inserts \`newHead\` at the beginning of \`self\`.` |
| Subscript | what it accesses | `/// Accesses the \`index\`th element.` |
| Initializer | what it creates | `/// Creates an instance containing \`n\` repetitions of \`x\`.` |
| Anything else | what it is | `/// A collection that supports equally efficient insertion at any position.` |

After the summary, add `- Parameters:`, `- Returns:`, `- Throws:`, and
`- Complexity:` lines when they apply. Document the complexity of any computed property
that is not O(1), because callers assume property access is cheap.

```swift
/// Returns the port number stored under `key`.
///
/// - Parameters:
///   - key: The settings key to read.
///   - settings: The settings to search.
/// - Returns: A port between 1 and 65535.
/// - Throws: `PortError.missing` when `settings` has no value for `key`.
func port(forKey key: String, in settings: [String: Int]) throws -> Int {
  guard let port = settings[key] else { throw PortError.missing(key) }
  return port
}

enum PortError: Error {
  case missing(String)
}
```

## General conventions

- Prefer methods and properties to free functions. Use a free function when there is no
  obvious `self`, e.g., `min(x, y)`, or when the function is an unconstrained generic.
- Methods can share a base name when they do the same thing with different types. Don't
  overload on the return type alone, because the call site becomes ambiguous.
- Label tuple members and name closure parameters in a public signature, because the
  names appear in documentation and in code completion.

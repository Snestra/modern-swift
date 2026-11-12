# SwiftUI (digest)

Read the digest when the target imports SwiftUI. The rules cover state and concurrency
in views. They don't cover layout or visual design.

## State

Use `@Observable` for a model class. A view that reads a property of an `@Observable`
object updates when that property changes, and it ignores the other properties.

| Old form | New form |
|---|---|
| `class Model: ObservableObject` with `@Published` | `@Observable class Model` |
| `@StateObject var model = Model()` | `@State var model = Model()` |
| `@ObservedObject var model: Model` | `var model: Model`, or `@Bindable var model: Model` when the view needs bindings |
| `@EnvironmentObject var model: Model` | `@Environment(Model.self) var model` |

```swift
import SwiftUI

@MainActor @Observable
final class Counter {
  var count = 0
  var isLoading = false

  func loadInitialCount() async {
    isLoading = true
    defer { isLoading = false }
    try? await Task.sleep(for: .milliseconds(200))
    count = 10
  }
}

struct CounterView: View {
  @State private var counter = Counter()

  var body: some View {
    VStack {
      Text(counter.isLoading ? "Loading" : "\(counter.count)")
      Button("Add one") { counter.count += 1 }
    }
    .task { await counter.loadInitialCount() }
  }
}
```

Keep `@State` properties `private`, because only the view that owns the state should
write its first value. Model the states of a screen that exclude each other as one
`enum`, e.g., `loading`, `loaded([Item])`, and `failed(String)`.

## Isolation

`View` is isolated to the main actor, so `body`, `@State`, and every method on the view
run on the main actor. You don't need to write `@MainActor` on a view. A model class
needs `@MainActor` unless the target sets the default isolation to `MainActor`.

SwiftUI calls some closures off the main thread to keep frames fast. The closure type is
`@Sendable` in the API, e.g., in `visualEffect`, `onGeometryChange`, `Shape.path(in:)`,
and the requirements of `Layout`. When the compiler reports an isolation error inside
such a closure, copy the value the closure needs in its capture list. Don't send `self`.

```swift
import SwiftUI

struct PulseView: View {
  @State private var isPulsing = false

  var body: some View {
    Circle()
      .visualEffect { [isPulsing] content, _ in
        content.blur(radius: isPulsing ? 2 : 0)
      }
      .onTapGesture { isPulsing.toggle() }
  }
}
```

## Starting async work

| Work | Start it with | Reason |
|---|---|---|
| Loading data when a view appears | `.task { }` | SwiftUI cancels the task when the view goes away |
| Reloading when a value changes | `.task(id: value) { }` | SwiftUI cancels the old task and starts a new one |
| Work after a tap | `Task { }` inside the action | the action itself must stay synchronous |

An action closure such as a `Button` action is synchronous. Change the state that starts
an animation inside the action, so the change lands in the same frame as the tap. Then
start a `Task` for the slow work.

```swift
import SwiftUI

struct SaveButton: View {
  @State private var isSaving = false
  let save: @MainActor () async -> Void

  var body: some View {
    Button(isSaving ? "Saving" : "Save") {
      withAnimation { isSaving = true }
      Task {
        await save()
        isSaving = false
      }
    }
    .disabled(isSaving)
  }
}
```

Keep the async logic in the model and not in the view. The view starts the work, the
model changes one property when the work ends, and the view reads the property. You can
then call the model's methods directly without creating a view.

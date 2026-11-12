// swift-tools-version: 6.2
import PackageDescription

// Copy `settings` into your own Package.swift and pass it to each target.
let settings: [SwiftSetting] = [
  // A plain `async` function runs on the caller's actor, and `@concurrent` moves it off.
  .enableUpcomingFeature("NonisolatedNonsendingByDefault"),
  // A conformance on a main actor type is isolated to the main actor.
  .enableUpcomingFeature("InferIsolatedConformances"),
  // A protocol used as a type must be written `any P`.
  .enableUpcomingFeature("ExistentialAny"),
  // Imports are internal unless you write `public import`.
  .enableUpcomingFeature("InternalImportsByDefault"),
  // Each use of an unsafe API must be marked `unsafe`.
  .strictMemorySafety(),
  // App and UI targets only. Delete the next line in a library.
  .defaultIsolation(MainActor.self),
]

let package = Package(
  name: "Check",
  platforms: [.macOS(.v15)],
  targets: [
    .target(name: "Check", path: "check", swiftSettings: settings)
  ],
  swiftLanguageModes: [.v6]
)

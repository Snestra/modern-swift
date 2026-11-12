// swift-tools-version: 6.2
import PackageDescription

let package = Package(
  name: "Gallery",
  platforms: [.macOS(.v15), .iOS(.v18)],
  products: [.library(name: "Gallery", targets: ["Gallery"])],
  targets: [
    .target(
      name: "Gallery",
      swiftSettings: [
        .enableUpcomingFeature("NonisolatedNonsendingByDefault"),
        .enableUpcomingFeature("InferIsolatedConformances"),
        .defaultIsolation(MainActor.self),
      ]
    )
  ],
  swiftLanguageModes: [.v6]
)

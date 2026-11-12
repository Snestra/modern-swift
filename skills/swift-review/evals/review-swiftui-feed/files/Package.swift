// swift-tools-version: 6.2
import PackageDescription

let package = Package(
  name: "Feed",
  platforms: [.macOS(.v15)],
  products: [.library(name: "Feed", targets: ["Feed"])],
  targets: [.target(name: "Feed")],
  swiftLanguageModes: [.v6]
)

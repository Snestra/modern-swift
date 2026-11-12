// Expect: [AvoidRetroactiveConformances] from `swift format lint`.

extension Int: @retroactive Error {}

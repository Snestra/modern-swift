// Expect: [NeverUseForceTry] from `swift format lint`.

enum LoadError: Error { case missing }

func load() throws -> Int { throw LoadError.missing }

func loadOrCrash() -> Int {
  try! load()
}

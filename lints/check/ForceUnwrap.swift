// Expect: [NeverForceUnwrap] from `swift format lint`.

func port(from text: String) -> Int {
  Int(text)!
}

// Expect: [ReplaceForEachWithForLoop] from `swift format lint`.

func printAll(_ names: [String]) {
  names.forEach { print($0) }
}

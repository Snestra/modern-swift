// Expect: [UseEarlyExits] from `swift format lint`.

func describe(_ value: Int?) -> String {
  if let value {
    let doubled = value * 2
    return "\(doubled)"
  } else {
    return "none"
  }
}

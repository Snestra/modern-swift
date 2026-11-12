// Expect: warning [#StrictMemorySafety] from `swift build`.

/// Reads the first value behind a pointer.
func firstValue(_ pointer: UnsafePointer<Int>) -> Int {
  pointer.pointee
}

---
type: llm
focus: trace
weight: 1
---

The port is proportionate: it does not reimplement JavaScript number or string semantics, it adds no public API beyond the original's operations plus the conformances Swift callers expect (Equatable, Hashable, Sendable, CustomStringConvertible, Error), and its code lines in Sources/ (excluding comments and doc comments) are under twice the code lines of cart.ts

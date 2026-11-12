---
type: llm
focus: trace
weight: 1
---

The port is proportionate: it does not reimplement Python string or integer semantics, it adds no public API beyond the original's operations plus the conformances Swift callers expect (Equatable, Hashable, Sendable, CustomStringConvertible, Error, count or isEmpty), and its code lines in Sources/ (excluding comments and doc comments) are under two and a half times the code lines of taskgraph.py

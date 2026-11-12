---
type: llm
focus: trace
weight: 1
---

The downscaling runs off the main actor through a function marked @concurrent (directly or on a nonisolated type), not through Task.detached or DispatchQueue

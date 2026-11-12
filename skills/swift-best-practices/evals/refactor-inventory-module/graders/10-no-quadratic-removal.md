---
type: llm
focus: trace
weight: 1
---

removeDiscontinued no longer calls remove(at:) inside a loop over the same array; it uses filter, removeAll(where:), or a single pass over the dictionary

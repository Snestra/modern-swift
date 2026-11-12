---
type: llm
focus: trace
weight: 1
---

REVIEW.md flags that the continuation in fetch is never resumed when data is nil (the request failed), connects it to the spinner that never goes away, and places it in its highest-priority category

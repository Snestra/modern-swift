---
type: llm
focus: trace
weight: 1
---

REVIEW.md flags that the onReload closure stored on FeedViewModel captures self strongly, which creates a retain cycle

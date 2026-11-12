---
type: llm
focus: trace
weight: 1
---

REVIEW.md flags that ImageCache.image checks the cache, awaits the download, and then writes, so two calls for one address both download, and recommends storing the in-flight task or checking again after the await

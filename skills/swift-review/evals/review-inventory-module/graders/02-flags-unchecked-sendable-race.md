---
type: llm
focus: trace
weight: 1
---

REVIEW.md flags that InventoryManager is @unchecked Sendable with no lock while saveInBackground reads items on a background queue, identifies it as a data race, and places it in its highest-priority category

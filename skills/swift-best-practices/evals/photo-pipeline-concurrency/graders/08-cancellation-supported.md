---
type: llm
focus: trace
weight: 1
---

The import stops when its task is cancelled: the work checks Task.isCancelled or Task.checkCancellation, or relies on task group cancellation, and the reply says how the caller cancels it (for example the .task view modifier)

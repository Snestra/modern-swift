---
type: llm
focus: trace
weight: 1
---

Each concurrent job creates or owns its own Scaler; no single Scaler instance is shared between concurrent child tasks, and Scaler is not made Sendable by adding a lock

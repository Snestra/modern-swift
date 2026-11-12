---
type: llm
focus: trace
weight: 1
---

parseCoupon returns nil for FREE: and FREE:a:b (it does not lose the empty part to split's default omittingEmptySubsequences), and for SAVE-5, SAVE1.5, SAVE0, SAVE101, and OFF0 (it does not accept a sign that Int's initializer would parse)

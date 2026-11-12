---
tags: [swift-port]
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Can you port taskgraph.py to Swift? I want a modern Swift package with the same behavior, and port test_taskgraph.py too so we know it matches. Put the package in the current directory (Package.swift, Sources/TaskGraph/, Tests/TaskGraphTests/) and add a PORTING.md with notes for the reviewer.

Input files: taskgraph.py, test_taskgraph.py

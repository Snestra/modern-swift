---
tags: [swift-best-practices]
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Importing 200 photos freezes the gallery screen for several seconds. Instruments shows all the time is in Scaler.downscale, called from GalleryModel.importPhotos on the main thread. Can you fix the freeze? Thumbnails must still end up in the same order as the photos, and if the user leaves the screen the import should stop. Keep the Package.swift settings as they are.

Input files: Package.swift, Sources/Gallery/GalleryModel.swift

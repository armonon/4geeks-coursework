---
name: coursework-repository-audit
description: Verify the TrackFlow milestone branches, immutable snapshot commits, required deliverables, and local repository state before coursework is submitted or continued.
---

Use this skill when the user asks whether the coursework repository is
organized correctly, which milestone branch to use, or whether submission
branches are still intact.

Run:

```bash
node {baseDir}/scripts/audit.mjs
```

Explain errors first, then warnings. This skill is read-only. Never repair,
commit, push, delete, or repoint a branch without fresh user approval.

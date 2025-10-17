export const DOC_TYPES = [
  { id: "user-manual", label: "User Manual" },
  { id: "faq", label: "FAQ" },
  { id: "runbook", label: "Runbook / Ops" },
  { id: "release-notes", label: "Release Notes" },
  { id: "architecture", label: "Architecture Overview" },
];

export const TEMPLATES = {
  "user-manual": `# {TITLE}
Version: {VERSION}
Last updated: {DATE}

## Overview
…

## Prerequisites
- OS:
- Dependencies:
- Access rights:

## Installation
1. …

## Quick Start
1. …

## Features
- …

## Troubleshooting
| Symptom | Cause | Fix |
| --- | --- | --- |
|  |  |  |

## Support
Links, contacts, SLAs.
`,
  faq: `# {TITLE} — FAQ
_Last updated: {DATE}_

**Q:** …
**A:** …
`,
  runbook: `# {TITLE} — Runbook
Service: {SERVICE}
On-call: {ONCALL}

## Purpose
…

## Procedures
1) …

### Rollback
…`,
  "release-notes": `# {TITLE} — Release Notes
Version: {VERSION}
Date: {DATE}

## Highlights
- …
`,
  "architecture": `# {TITLE} — Architecture Overview
Last updated: {DATE}

## Context
…

## Topology
…
`
};

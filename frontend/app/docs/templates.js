// frontend/app/docs/templates.js
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
Briefly explain what this product does and who it's for.

## Prerequisites
- OS:
- Dependencies:
- Access rights:

## Installation
1. …
2. …

## Quick Start
1. …
2. …

## Features
- Feature A
- Feature B

## Troubleshooting
| Symptom | Cause | Fix |
| --- | --- | --- |
|  |  |  |

## Support
Links, contacts, SLAs.`,

  faq: `# {TITLE} — FAQ
_Last updated: {DATE}_

**Q:** …
**A:** …

**Q:** …
**A:** …

> Tip: keep answers concise and link to deeper docs when needed.`,

  "runbook": `# {TITLE} — Runbook
Service: {SERVICE}
On-call rotation: {ONCALL}

## Purpose
When and why this runbook is used.

## Pre-checks
- [ ] Access to production
- [ ] Incident ticket created
- [ ] …

## Procedures
### Scenario 1: {SCENARIO}
1) …
2) …

### Rollback
- …

## Validation
- …

## Post-incident
- Notes
- Follow-ups`,

  "release-notes": `# {TITLE} — Release Notes
Version: {VERSION}
Date: {DATE}

## Highlights
- …

## Changes
### Added
- …
### Fixed
- …
### Changed
- …

## Migration / Actions Required
- …

## Known Issues
- …`,

  "architecture": `# {TITLE} — Architecture Overview
Last updated: {DATE}

## Context
Business goals and constraints.

## Topology
- Services
- Data stores
- External deps

## Key Flows
1. …

## Decisions (ADR)
- Decision: …
- Rationale: …
- Consequences: …

## Non-Functionals
- Performance
- Reliability
- Security
- Cost

## Glossary
- Term: definition
`
};

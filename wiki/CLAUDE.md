# MalumeScholarTrack Wiki - Schema

## Wiki Location
`~/wiki/projects/malumescholartrack/` → `~/MalumeScholarTrack-Expo54/wiki/`

## Purpose
Track compliance patterns, driver history, safety incidents, transport regulations.

## Page Format

### Compliance Pattern
```markdown
---
type: compliance
document: pdp
requirement: Transport permit
---

## Requirement
What is needed.

## Verification
How to verify authenticity.

## Common Issues
- Expired permits
- Invalid route authorization
```

### Driver Record
```markdown
---
driver-id: DRV-001
name: John Doe
compliance: 10/10
trips: 245
rating: 4.8
---

## Compliance Status
- ID: ✅ verified
- PDP: ✅ valid
- License: ✅ valid
...

## Incidents
Any safety incidents on record.
```

## Cross-Reference
- Link to `~/wiki/central/regulations/` for transport laws
- Link to `~/wiki/central/code/` for shared Supabase patterns

## INDEX.md Format
| Page | Category | Summary |
|------|----------|---------|
| compliance/pdp.md | Compliance | Public Driving Permit requirements |
| drivers/active.md | Driver | Active driver records |

## log.md Format
## [2026-04-06] init | Created MalumeScholarTrack wiki structure
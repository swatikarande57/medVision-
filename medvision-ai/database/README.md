# Database

MySQL 8.x schema bootstrap for MedVision AI.

## Files

| File | Purpose |
|------|---------|
| `init/01-init.sql` | Creates `medvision` database, charset, placeholder `schema_version` table |

## Usage

**Docker Compose** mounts `init/` to `/docker-entrypoint-initdb.d` automatically.

**Manual:**

```sql
SOURCE database/init/01-init.sql;
```

Full relational schema (users, patients, scans, etc.) will be added via Flyway migrations in backend Phase 1 — see `docs/TECHNICAL_DESIGN.md`.

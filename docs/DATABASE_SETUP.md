# Database Setup (PostgreSQL)

## Technology

- **Engine:** PostgreSQL 15 (Compose image `postgres:15-alpine`)
- **Client:** `pg` in NestJS backend
- **Migrations:** SQL files under `backend/src/database/migrations/`
- **Migrator script:** `backend` → `npm run migrate` (runs `dist/src/database/migrator.js` after `npm run build`)

Dev / staging / production must use **different** credentials and databases.

---

## 1. Local development with Docker Compose

From repository root:

```bash
docker compose up -d postgres
```

Defaults (local only — change before any shared host):

| Variable | Default in compose |
| --- | --- |
| `POSTGRES_USER` | `brick_admin` |
| `POSTGRES_PASSWORD` | `local_dev_only_change_me` |
| `POSTGRES_DB` | `brick_supply_saas` |
| Port | `5432` |

Compose mounts `backend/src/database/migrations` into `/docker-entrypoint-initdb.d` so **first** container init applies SQL automatically. Re-creating the volume re-runs init scripts.

Healthcheck: `pg_isready`.

---

## 2. Backend connection env

Copy `backend/.env.example` → `backend/.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=local_dev_password
DB_NAME=brick_supply_saas_dev
DATABASE_URL=postgresql://postgres:local_dev_password@127.0.0.1:5432/brick_supply_saas_dev
```

Prefer `DATABASE_URL` for Docker-linked hosts:

```env
DATABASE_URL=postgresql://brick_admin:local_dev_only_change_me@127.0.0.1:5432/brick_supply_saas
```

Production URLs should include TLS, e.g. `?sslmode=require` (provider-specific).

---

## 3. Migrations

| Order | File |
| ---: | --- |
| 1 | `001_initial_schema.sql` |
| 2 | `002_platform_workflow.sql` |

```bash
cd backend
npm ci
npm run build
npm run migrate
```

**Rules**

- Do not invent destructive “drop all” scripts for production.
- Review SQL before applying to staging/production.
- Prefer additive migrations; test on a staging clone first.

---

## 4. Environment separation

| Env | Database | Notes |
| --- | --- | --- |
| Development | Local Docker or laptop Postgres | Fake passwords OK |
| Staging | Separate cloud DB | Same schema, anonymized data |
| Production | Locked-down cloud DB | Restricted user, TLS, backups |

Never point a local frontend at production DB credentials.

---

## 5. Verification commands

```bash
# Connectivity (Docker)
docker compose exec postgres pg_isready -U brick_admin -d brick_supply_saas

# Or psql
psql "$DATABASE_URL" -c '\dt'

# API up (after backend start)
curl -s http://127.0.0.1:3000/health
```

Confirm expected tables from migration files exist (tenant / platform workflow tables as defined in SQL).

---

## 6. Backup & restore

### Backup

```bash
docker compose exec -T postgres pg_dump -U brick_admin brick_supply_saas > backup-$(date +%Y%m%d).sql
```

Or managed-provider snapshot (RDS, Cloud SQL, Neon, Supabase, etc.).

### Restore (destructive — confirm target first)

```bash
# WARNING: overwrites objects in the target database
psql "$DATABASE_URL" < backup-YYYYMMDD.sql
```

Test restore on staging before relying on it.

---

## 7. Security

- Never embed `DATABASE_URL` in frontend or Capacitor public config
- Never commit real passwords
- Use a least-privilege DB role for the app (DML + migrate role separately if possible)
- Restrict inbound 5432 to private network / VPN
- Do not log full connection strings

---

## 8. File / document storage note

Invoices and enquiry photos are **not** stored in a dedicated object bucket in this repository. Large bodies are capped at 5 MB on Nest. If you add S3/R2 later, keep credentials backend-only and document the bucket policy here.

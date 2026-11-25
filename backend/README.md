# mindSwipe backend — Phase 2, build-1

Spring Boot + JdbcTemplate + Flyway over Postgres. Build-1 goal: serve the swipe
feed and **capture every user input** (answer choice, like/dislike, view) into the
database. No auth/RLS yet — a seeded demo user stands in until Supabase Auth lands.

This is a deliberate subset of the full model in [../docs/TECH.md](../docs/TECH.md).

## Stack

- Java **21** (LTS) — in IntelliJ: *Project Structure → SDKs → Download JDK → Temurin 21*.
- Spring Boot **3.5.0**, Maven (bundled in IntelliJ, no install needed).
- Data access: **JdbcTemplate** (explicit SQL) + **Flyway** migrations. Postgres driver.

## Prerequisites

1. **JDK 21** available to the project.
2. A reachable **Postgres** with a database and a user. On the Ubuntu server:
   ```bash
   sudo -u postgres psql -c "create user mindswipe with password 'mindswipe';"
   sudo -u postgres psql -c "create database mindswipe owner mindswipe;"
   ```
   No Docker required. Flyway creates all tables on first start; the seeder loads
   the 1000-card bank if `post` is empty.

## Configuration (env vars, with defaults)

| Var | Default | Purpose |
| --- | --- | --- |
| `DB_URL` | `jdbc:postgresql://localhost:5432/mindswipe` | JDBC URL |
| `DB_USER` | `mindswipe` | DB user |
| `DB_PASSWORD` | `mindswipe` | DB password |
| `PORT` | `4000` | HTTP port (matches old backend) |
| `SEED_ENABLED` | `true` | load the question bank on first run |
| `CORS_ORIGINS` | `*` | allowed browser origins (dev) |

To reach Postgres on the Ubuntu box from this machine, either expose 5432 or open
an SSH tunnel and point `DB_URL` at `localhost`:
```bash
ssh -N -L 5432:localhost:5432 user@ubuntu-host
```

## Run

- **IntelliJ:** run `MindSwipeApplication`. Set env vars in the run config.
- **CLI:** `mvn spring-boot:run` (or `./mvnw spring-boot:run` once a wrapper is added).

On first start you should see Flyway apply `V1__init` and the seeder log
`Seeded 1000 cards`.

## Endpoints (`/api`)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/feed?cursor=&limit=&topic=&difficulty=` | keyset feed page |
| GET | `/posts/{id}` | one card |
| GET | `/topics` | topics with counts (`{ items: [...] }`) |
| POST | `/attempts` | record a choice: `{ postId, selected:["c2"], durationMs?, detail? }` |
| POST | `/reactions` | like/dislike: `{ postId, kind:"like"\|"dislike", on? }` |
| POST | `/views` | record a view: `{ postId }` |
| GET | `/me/state` | this user's liked / disliked / answered post ids |
| GET | `/health` | liveness |

"Who is acting" comes from an optional `X-User-Id` header (defaults to the seeded
demo user). Everything is scoped to the single seeded `public` tenant.

## Not in build-1 (next builds)

Auth (Supabase/JWT) + RLS, server-side grading for *graded* cards, the Leitner
scheduling engine, rollups/dashboards, the full tenant/entitlement model. See the
roadmap and TECH.md.

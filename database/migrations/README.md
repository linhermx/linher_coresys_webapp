# Database Migrations

Migration files are versioned SQL files and must be executed in filename order.

Rules:
- Use `YYYYMMDDHHmmss_<description>.sql`.
- Use `snake_case` table and column names.
- Use explicit foreign keys for relational ownership.
- Keep runtime schema in migrations; keep development-only data in `database/seeds/` only after user approval.
- Do not use JSON as a substitute for relational tables. JSON is only allowed for logs or snapshots.
- Do not store integration secrets unless the domain and storage strategy are explicitly approved.
- Keep every migration idempotent when possible with `CREATE TABLE IF NOT EXISTS`.

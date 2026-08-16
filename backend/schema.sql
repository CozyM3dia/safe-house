-- S.A.F.E House — skema Supabase / PostgreSQL.
--
-- Backend menjalankan DDL ini otomatis saat start (CREATE ... IF NOT EXISTS),
-- jadi menjalankan file ini manual bersifat opsional. Disediakan sebagai
-- referensi dan untuk provisioning lewat Supabase SQL editor.
--
-- Audit disimpan utuh sebagai JSONB agar bentuk AuditResult (Pydantic) tidak
-- perlu dipecah jadi banyak kolom. Kolom lat/lon didup untuk indeks kedekatan.

create extension if not exists pgcrypto;

create table if not exists audits (
    id         uuid primary key default gen_random_uuid(),
    lat        double precision not null,
    lon        double precision not null,
    data       jsonb not null,
    created_at timestamptz not null default now()
);
create index if not exists audits_lat_lon_idx on audits (lat, lon);

create table if not exists shared_reports (
    id       uuid primary key default gen_random_uuid(),
    slug     text unique not null,
    audit_id uuid not null references audits(id) on delete cascade,
    views    integer not null default 0
);
create index if not exists shared_reports_audit_idx on shared_reports (audit_id);

-- Cache narrative kompetisi. Fingerprint dibuat dari data teknis audit,
-- bukan alamat/koordinat. Lihat services/ai.py:audit_fingerprint.
create table if not exists ai_narratives (
    audit_fingerprint text primary key,
    lang              text,
    narrative         jsonb not null,
    model             text,
    prompt_version    text,
    generated_at      timestamptz not null default now(),
    expires_at        timestamptz
);

-- Ananta — Postgres init script
-- Runs once on first container boot. Enable required extensions.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- composite indexes

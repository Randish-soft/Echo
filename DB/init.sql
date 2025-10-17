CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "hstore";

CREATE SCHEMA IF NOT EXISTS echo;

-- Repositories we know about (one row per URL+branch)
CREATE TABLE IF NOT EXISTS echo.repositories (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  url           text NOT NULL,
  branch        text NOT NULL DEFAULT 'main',
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_used_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (url, branch)
);

-- Optional: track “last selected” per (anonymous) client token
-- If you have auth/users, swap client_token for user_id.
CREATE TABLE IF NOT EXISTS echo.repo_selections (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_token  text NOT NULL,
  repo_id       uuid NOT NULL REFERENCES echo.repositories(id) ON DELETE CASCADE,
  selected_at   timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_repositories_url_trgm ON echo.repositories USING gin (url gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_repo_selections_token_time ON echo.repo_selections (client_token, selected_at DESC);

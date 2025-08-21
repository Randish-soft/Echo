-- PostgreSQL bootstrap for RepoDocs.
-- Creates minimal tables to track projects, documents, and generation jobs.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  repo_url    TEXT UNIQUE NOT NULL,
  default_branch TEXT DEFAULT 'main',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path        TEXT NOT NULL,                        -- e.g., README.md, docs/architecture.md
  sha         TEXT,                                 -- optional: git blob/tree SHA
  content_md  TEXT,                                 -- current Markdown content
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, path)
);

CREATE TABLE IF NOT EXISTS generations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_path  TEXT,                                 -- input file or logical target
  prompt       TEXT NOT NULL,
  model        TEXT NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('queued','running','succeeded','failed')),
  output_md    TEXT,
  error_msg    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS webhooks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  event       TEXT NOT NULL,                         -- e.g., push, release, pr_merged
  payload     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_documents_project_path ON documents(project_id, path);
CREATE INDEX IF NOT EXISTS idx_generations_project_status ON generations(project_id, status);
CREATE INDEX IF NOT EXISTS idx_webhooks_project_created ON webhooks(project_id, created_at);

-- Example seed (optional)
-- INSERT INTO projects (name, repo_url) VALUES ('Echo', 'https://github.com/your-org/echo.git');

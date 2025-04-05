-- 1) Check if "echodb" exists; if not, create it.
SELECT 1 FROM pg_database WHERE datname = 'echodb';

-- 2) Create 'echodb' if it doesn't exist
\c echodb

-- 3) Create 'users' table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(200) NOT NULL
);

-- 4) Create 'documents' table if it doesn't exist
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  owner_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_owner
    FOREIGN KEY (owner_id)
    REFERENCES users (id)
    ON DELETE CASCADE
);

-- (NEW) Add columns for GitHub repo and branch if they don’t exist
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS repo_full_name TEXT;

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS branch_name TEXT;

-- 5) Create 'document_shares' table if it doesn't exist
CREATE TABLE IF NOT EXISTS document_shares (
  id SERIAL PRIMARY KEY,
  document_id INT NOT NULL,
  shared_with_user_id INT NOT NULL,
  permission VARCHAR(50) NOT NULL DEFAULT 'view',

  CONSTRAINT fk_document
    FOREIGN KEY (document_id)
    REFERENCES documents (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_shared_user
    FOREIGN KEY (shared_with_user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
);

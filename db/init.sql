-- db/init.sql

-- 1) Check if "mydb" exists; if not, create it.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_database WHERE datname = 'mydb'
    ) THEN
        CREATE DATABASE "mydb";
    END IF;
END
$$;

-- 2) Switch to "mydb" to create tables inside it
\connect mydb;

-- 3) Create 'users' table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,  -- <-- ADDED THIS LINE
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

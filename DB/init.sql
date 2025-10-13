-- ./db/init/001_echo.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "hstore";

-- Schema and app role
CREATE SCHEMA IF NOT EXISTS echo AUTHORIZATION CURRENT_USER;

-- If you want a dedicated app user (use env or hardcode with care):
-- CREATE USER echo_app WITH PASSWORD 'change-me' LOGIN;
-- GRANT USAGE ON SCHEMA echo TO echo_app;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA echo GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO echo_app;

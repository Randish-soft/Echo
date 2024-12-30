import { Pool } from 'pg';
import { DATABASE_URL } from './config';

export const pool = new Pool({
    connectionString: DATABASE_URL,
});

// Optional: test the connection
pool
    .connect()
    .then(() => console.log('Connected to PostgreSQL!'))
    .catch(err => console.error('Connection error', err.stack));

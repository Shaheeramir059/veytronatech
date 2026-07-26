const postgres = require('postgres');

let sql;
let schemaReady;

function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
  if (!sql) sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, idle_timeout: 10, connect_timeout: 10 });
  return sql;
}

async function ensureSchema() {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const db = getDb();
    await db`CREATE TABLE IF NOT EXISTS contact_messages (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(254) NOT NULL,
      company VARCHAR(150),
      project_type VARCHAR(100) NOT NULL,
      budget VARCHAR(100),
      message TEXT NOT NULL,
      status VARCHAR(10) NOT NULL DEFAULT 'unread' CHECK (status IN ('read', 'unread')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  })();
  return schemaReady;
}

module.exports = { getDb, ensureSchema };

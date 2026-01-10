import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Verify connection on startup
pool.query('SELECT 1')
  .then(() => console.log('[DB] Connection verified'))
  .catch(err => {
    console.error('[DB] Connection failed:', err);
    process.exit(1);
  });

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('[DB] Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('[DB] Query error', { text, error: err instanceof Error ? err.stack : err });
    throw err;
  }
};

export const getClient = () => pool.connect();

export const initDB = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'USER',
        credits INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        type TEXT NOT NULL,
        logo_url TEXT,
        content TEXT,
        stock INTEGER DEFAULT -1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS redeem_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT UNIQUE NOT NULL,
        amount INTEGER NOT NULL,
        is_used BOOLEAN DEFAULT false,
        created_by TEXT DEFAULT 'system',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        user_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES tickets(id),
        sender_id UUID REFERENCES users(id),
        sender_email TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        item_id UUID REFERENCES items(id),
        item_name TEXT NOT NULL,
        content_delivered TEXT,
        price INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[DB] Database initialized successfully');
  } catch (err) {
    console.error('[DB] Database initialization failed:', err);
    process.exit(1);
  }
};

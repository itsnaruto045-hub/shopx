import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.ts';

const router = express.Router();
const JWT_SECRET = process.env.SESSION_SECRET || 'fallback_secret';

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Admin check using DB count
    const userCountRes = await query('SELECT COUNT(*) FROM users');
    const isFirstUser = parseInt(userCountRes.rows[0].count) === 0;
    
    // Check if we should allow a specific email to be admin if the count check is flaky
    const role = isFirstUser ? 'ADMIN' : 'USER';
    
    console.log('[Auth] Registration attempt:', { username, isFirstUser, assignedRole: role });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert and verify
    const result = await query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role, credits',
      [username, hashedPassword, role]
    );
    
    if (!result.rows.length) {
      throw new Error('User insertion failed: No rows returned');
    }
    
    console.log('[Auth] User registered:', result.rows[0].username, 'Role:', result.rows[0].role);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Auth] Registration error:', err);
    res.status(400).json({ error: 'Username taken or database error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      res.cookie('token', token, { httpOnly: true, sameSite: 'strict' });
      
      console.log('[Auth] User logged in:', user.username);
      res.json({ id: user.id, username: user.username, role: user.role, credits: user.credits });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const result = await query('SELECT id, username as email, role, credits FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/codes', async (req, res) => {
  try {
    const result = await query('SELECT * FROM redeem_codes ORDER BY created_at DESC');
    res.json(result.rows.map(r => ({
      id: r.id,
      code: r.code,
      amount: r.amount,
      isUsed: r.is_used,
      createdBy: r.created_by,
      createdAt: r.created_at.getTime()
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch codes' });
  }
});

router.post('/codes', async (req, res) => {
  const { code, amount } = req.body;
  try {
    const result = await query(
      'INSERT INTO redeem_codes (code, amount) VALUES ($1, $2) RETURNING *',
      [code, amount]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create code' });
  }
});

router.post('/redeem', async (req, res) => {
  const { userId, code } = req.body;
  try {
    const codeRes = await query('SELECT * FROM redeem_codes WHERE code = $1 AND is_used = false', [code]);
    if (codeRes.rows.length === 0) return res.status(400).json({ error: 'Invalid or already used code' });
    
    const amount = codeRes.rows[0].amount;
    await query('BEGIN');
    await query('UPDATE users SET credits = credits + $1 WHERE id = $2', [amount, userId]);
    await query('UPDATE redeem_codes SET is_used = true WHERE code = $1', [code]);
    await query('COMMIT');
    
    res.json({ success: true, amount });
  } catch (err) {
    await query('ROLLBACK');
    res.status(500).json({ error: 'Redemption failed' });
  }
});

export default router;

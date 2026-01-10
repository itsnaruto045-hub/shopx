import express from 'express';
import { query, getClient } from '../db.ts';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM items ORDER BY created_at DESC');
    res.json(result.rows.map(r => ({
      ...r,
      logoUrl: r.logo_url
    })));
  } catch (err) {
    console.error('[Items] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

router.post('/', async (req, res) => {
  const { name, description, price, type, content, logoUrl } = req.body;
  try {
    const result = await query(
      'INSERT INTO items (name, description, price, type, content, logo_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, price, type, content, logoUrl]
    );
    
    if (!result.rows.length) {
      throw new Error('Item insertion failed');
    }

    console.log('[Items] Item created:', result.rows[0].name);
    res.json({
      ...result.rows[0],
      logoUrl: result.rows[0].logo_url
    });
  } catch (err) {
    console.error('[Items] Creation error:', err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Purchase logic with transaction
router.post('/purchase', async (req, res) => {
  const { userId, itemId } = req.body;
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const userRes = await client.query('SELECT credits FROM users WHERE id = $1 FOR UPDATE', [userId]);
    const itemRes = await client.query('SELECT * FROM items WHERE id = $1', [itemId]);
    
    const user = userRes.rows[0];
    const item = itemRes.rows[0];
    
    if (!user || !item) throw new Error('User or item not found');
    if (user.credits < item.price) throw new Error('Insufficient credits');
    
    // Deduct credits
    await client.query('UPDATE users SET credits = credits - $1 WHERE id = $2', [item.price, userId]);
    
    // Record purchase
    const purchaseRes = await client.query(
      'INSERT INTO purchases (user_id, item_id, item_name, content_delivered, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, itemId, item.name, item.content, item.price]
    );
    
    await client.query('COMMIT');
    console.log('[Purchase] Success:', { userId, itemId });
    res.json(purchaseRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Purchase] Failed, rolled back:', err);
    res.status(400).json({ error: err instanceof Error ? err.message : 'Purchase failed' });
  } finally {
    client.release();
  }
});

router.get('/purchases', async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await query(
      'SELECT * FROM purchases WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      itemId: r.item_id,
      itemName: r.item_name,
      contentDelivered: r.content_delivered,
      price: r.price,
      timestamp: r.created_at.getTime()
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, type, content, logoUrl } = req.body;
  try {
    const result = await query(
      'UPDATE items SET name = $1, description = $2, price = $3, type = $4, content = $5, logo_url = $6 WHERE id = $7 RETURNING *',
      [name, description, price, type, content, logoUrl, id]
    );
    res.json({
      ...result.rows[0],
      logoUrl: result.rows[0].logo_url
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM items WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;

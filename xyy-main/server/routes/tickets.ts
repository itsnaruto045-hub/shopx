import express from 'express';
import { query } from '../db.ts';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, 
      (SELECT json_agg(m) FROM (SELECT * FROM ticket_messages WHERE ticket_id = t.id ORDER BY timestamp ASC) m) as messages
      FROM tickets t 
      ORDER BY last_updated DESC
    `);
    res.json(result.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      userEmail: r.user_email,
      subject: r.subject,
      status: r.status,
      lastUpdated: r.last_updated.getTime(),
      messages: r.messages?.map((m: any) => ({
        id: m.id,
        senderId: m.sender_id,
        senderEmail: m.sender_email,
        text: m.text,
        timestamp: m.timestamp.getTime()
      })) || []
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

router.post('/', async (req, res) => {
  const { subject, message } = req.body;
  // In a real app, userId would come from the JWT session
  // For now we'll assume a user exists or handle auth properly
  res.status(501).json({ error: 'Not fully implemented without session context' });
});

router.post('/:id/messages', async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  // Message logic...
});

router.post('/:id/close', async (req, res) => {
  const { id } = req.params;
  await query('UPDATE tickets SET status = \'closed\', last_updated = NOW() WHERE id = $1', [id]);
  res.json({ success: true });
});

export default router;

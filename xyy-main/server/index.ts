import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './db.ts';
import authRoutes from './routes/auth.ts';
import itemRoutes from './routes/items.ts';
import ticketRoutes from './routes/tickets.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/tickets', ticketRoutes);

// Handle SPA routing - send index.html for any unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
});

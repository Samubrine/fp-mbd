import express from 'express';
import cors from 'cors';
import { pool } from './config/db.js';
import { router as apiRouter } from './routes/index.js';

const app = express();

app.use(cors());
app.use(express.json());

// API routing
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1 + 1 AS result');
    res.json({ status: 'ok', db: 'connected', test: result.rows[0].result });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Fallback for Vercel Serverless Function lifecycle wrapper
export default app;

const port = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

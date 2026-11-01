import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import './db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import locationRoutes from './routes/locations.js';
import placementRoutes from './routes/placement.js';
import reportRoutes from './routes/reports.js';
import { HttpError } from './errors.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET missing or too short (min 32 chars). Copy .env.example to .env first.');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/placement', placementRoutes);
app.use('/api/reports', reportRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Nav atrasts' }));

app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Nederīgs JSON' });
  console.error(err);
  res.status(500).json({ error: 'Servera kļūda' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`STASH API running on http://localhost:${port}`));

import express from 'express';
import trekkerRoutes from './routes/trekkerRoutes.js';
import tentRoutes from './routes/tentRoutes.js';
import rentalRoutes from './routes/rentalRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { initializeDatabase } from './config/database.js';

const app = express();

// Middleware
app.use(express.json());

// Initialize database on startup
initializeDatabase().catch(console.error);

// Routes
app.use('/api/trekkers', trekkerRoutes);
app.use('/api/tents', tentRoutes);
app.use('/api/rentals', rentalRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'TrekGear Hub API' });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
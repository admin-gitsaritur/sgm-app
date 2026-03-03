import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './src/server/routes/index.js';
import { config } from './src/server/config.js';
import { initDb } from './src/server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = config.port;

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for Vite dev
  }));

  // CORS
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parser with size limit
  app.use(express.json({ limit: '1mb' }));

  // Rate limiting — login endpoint
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/auth/login', loginLimiter);

  // Rate limiting — general API
  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', apiLimiter);

  // API Routes
  app.use('/api', apiRouter);

  // Global error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.use('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Initialize PostgreSQL database (create tables if needed)
  try {
    await initDb();
  } catch (err: any) {
    console.error('⚠️  Não foi possível conectar ao PostgreSQL:', err.message);
    console.error('   O servidor continuará rodando, mas as rotas de API que dependem do banco irão falhar.');
    console.error('   Verifique a variável DATABASE_URL no .env');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

startServer();

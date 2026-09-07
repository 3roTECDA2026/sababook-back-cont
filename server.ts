import 'dotenv/config'; // <-- Mantiene la carga del .env
import express, { Request, Response } from 'express';
import cors from 'cors';

// Como server.ts está en la raíz, volvemos a apuntar a ./src/...
import foroRoutes from './src/routes/foro.routes.js';
import comentarioRoutes from './src/routes/comentario.routes.js';
import userRoutes from './src/routes/user.routes.js';
import { testConnection } from './src/db/connect/db.js';
import listaRoutes from './src/routes/lista.routes.js';
import listaLecturaRoutes from './src/routes/listaLectura.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import bookRoutes from './src/routes/book.routes.js';
import opinionRoutes from './src/routes/opinion.routes.js';
import favoriteRoutes from './src/routes/favorite.routes.js';
import medalRoutes from './src/routes/medal.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'https://statuesque-truffle-a9d0a3.netlify.app',
      'https://sababook-back.onrender.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

// Rutas
app.use('/api/v1/foro', foroRoutes);
app.use('/api/v1/comentario', comentarioRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/listas', listaRoutes);
app.use('/api/v1/listas-lectura', listaLecturaRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/libros', bookRoutes);
app.use('/api/v1/opinion', opinionRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/medal', medalRoutes);

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Hello World!\n');
});

// Iniciar servidor
testConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1);
  });
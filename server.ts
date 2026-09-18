import 'dotenv/config'; // <-- Mantiene la carga del .env
import express, { Request, Response } from 'express';
import cors from 'cors';

// Importación de rutas sin extensión .js
import authRoutes from './src/routes/auth.routes';
import bookRoutes from './src/routes/book.routes';
import commentRoutes from './src/routes/comment.routes';
import favoriteRoutes from './src/routes/favorite.routes';
import forumRoutes from './src/routes/forum.routes';
import listRoutes from './src/routes/list.routes';
import medalRoutes from './src/routes/medal.routes';
import readingListRoutes from './src/routes/readingList.routes';
import reviewRoutes from './src/routes/review.routes';
import userRoutes from './src/routes/user.routes';

import { testConnection } from './src/db/connect/db';

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

// Endpoints traducidos a inglés (/api/v1/...)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/books', bookRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/forums', forumRoutes);
app.use('/api/v1/lists', listRoutes);
app.use('/api/v1/medals', medalRoutes);
app.use('/api/v1/reading-lists', readingListRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/users', userRoutes);

// -------------------------------------------------------------
// ALIAS DE COMPATIBILIDAD CON EL FRONTEND LEGACY
// -------------------------------------------------------------
app.use('/api/v1/user', userRoutes);            // Resuelve http://localhost:3000/api/v1/user/17
app.use('/api/v1/usuario', userRoutes);         // Alias en español por si el front aún lo usa
app.use('/api/v1/usuarios', userRoutes);        // Alias en español plural
app.use('/api/v1/libro', bookRoutes);            // Alias singular para libros
app.use('/api/v1/libros', bookRoutes);           // Alias español para libros
app.use('/api/v1/opinion', reviewRoutes);        // Alias singular para opiniones
app.use('/api/v1/opiniones', reviewRoutes);      // Alias español para opiniones
app.use('/api/v1/comentarios', commentRoutes);  // Alias español para comentarios
app.use('/api/v1/lista-lectura', readingListRoutes); // Alias español para lista de lectura

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Hello World!\n');
});

// Iniciar servidor
testConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });
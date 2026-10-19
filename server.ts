
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';

// Importación de rutas
import authRoutes from './src/routes/auth.routes';
import bookRoutes from './src/routes/book.routes';
import cafeRoutes from './src/routes/cafe.routes';
import commentRoutes from './src/routes/comment.routes';
import courseRoutes from './src/routes/course.routes';
import favoriteRoutes from './src/routes/favorite.routes';
import feedRoutes from './src/routes/feed.routes';
import forumRoutes from './src/routes/forum.routes';
import listRoutes from './src/routes/list.routes';
import medalRoutes from './src/routes/medal.routes';
import metaLecturaRoutes from './src/routes/metaLectura.routes';
import moderationRoutes from './src/modules/moderation/routes/moderation.routes';
import readingListRoutes from './src/routes/readingList.routes';
import reviewRoutes from './src/routes/review.routes';
import subjectRoutes from './src/routes/subject.routes';
import triviaRoutes from './src/routes/trivia.routes';
import userRoutes from './src/routes/user.routes';
import radioRoutes from './src/routes/radio.routes';

// Conexión a la base de datos
import { testConnection } from './src/db/connect/db';

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------------------------------------------
// MIDDLEWARES
// -------------------------------------------------------------

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'https://statuesque-truffle-a9d0a3.netlify.app',
      'https://sababook-back.onrender.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

// -------------------------------------------------------------
// ENDPOINTS PRINCIPALES /api/v1/
// -------------------------------------------------------------

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/books', bookRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/medal', medalRoutes);
app.use('/api/v1/metas-lectura', metaLecturaRoutes);
app.use('/api/v1/feed', feedRoutes);
app.use('/api/v1/forums', forumRoutes);
app.use('/api/v1/lists', listRoutes);
app.use('/api/v1/reading-lists', readingListRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/radio', radioRoutes);
app.use('/api/v1/cafes', cafeRoutes);
app.use('/api/v1/trivia', triviaRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/moderation', moderationRoutes);

// -------------------------------------------------------------
// ALIAS DE COMPATIBILIDAD CON EL FRONTEND LEGACY
// -------------------------------------------------------------

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/usuario', userRoutes);
app.use('/api/v1/usuarios', userRoutes);

app.use('/api/v1/libro', bookRoutes);
app.use('/api/v1/libros', bookRoutes);

app.use('/api/v1/muro', feedRoutes);

app.use('/api/v1/opinion', reviewRoutes);
app.use('/api/v1/opiniones', reviewRoutes);

app.use('/api/v1/comentarios', commentRoutes);

app.use('/api/v1/lista-lectura', readingListRoutes);

app.use('/api/v1/radio-sabato', radioRoutes);

app.use('/api/v1/cafe', cafeRoutes);

app.use('/api/v1/moderacion', moderationRoutes);

// -------------------------------------------------------------
// RUTA PRINCIPAL
// -------------------------------------------------------------

app.get('/', (_req: Request, res: Response) => {
  res.status(200).send('Hello World!\n');
});

// -------------------------------------------------------------
// INICIAR SERVIDOR
// -------------------------------------------------------------

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

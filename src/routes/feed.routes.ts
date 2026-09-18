// src/routes/feed.routes.ts
import { Router } from 'express';
import obtenerFeed from '../controllers/feed.controller';

const router = Router();

router.get('/', obtenerFeed);

export default router;
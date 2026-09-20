// src/services/feed.service.ts
import { obtenerActividadesFeedDB } from '../models/feed.model';

class FeedService {
  async obtenerFeed(page?: number, limit?: number) {
    const pageNum = page && page > 0 ? page : 1;
    const limitNum = limit && limit > 0 ? limit : 20;

    return await obtenerActividadesFeedDB(pageNum, limitNum);
  }
}

export const feedService = new FeedService();
import { AuthRequest } from '../../../middleware/auth.middleware';
import { ModerationContext } from '../types/moderation.types';
import { getForumContext } from '../repositories/get-forum-context.repository';

export const resolveContext = async (
  req: AuthRequest,
  context: ModerationContext
): Promise<string | undefined> => {
  if (context === 'comentario_foro') {
    const rawForoId = req.params?.id || req.params?.foroId || req.body?.foro_id;
    const foroId = Number(rawForoId);
    if (foroId && !isNaN(foroId)) {
      const forumContext = await getForumContext(foroId);
      if (forumContext) return forumContext;
    }
  }
  return undefined;
};

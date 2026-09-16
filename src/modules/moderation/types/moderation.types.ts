export type ModerationContext = 'opinion' | 'foro' | 'comentario_foro';

export interface ModerationResult {
  isAppropriate: boolean;
  reason?: string;
  category?: string;
}

export interface ModeratorProvider {
  moderate(text: string): Promise<ModerationResult>;
}

export interface CreateIncidentDTO {
  usuario_id?: number;
  contexto: ModerationContext;
  contenido_bloqueado: string;
  motivo: string;
  categoria?: string;
}

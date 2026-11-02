// src/utils/listPermission.ts
import { prisma } from '../db/connect/db';
import { TipoRol } from '@prisma/client';

// Verificar identidad y permisos sobre la lista.
// La usan /lists y /reading-lists (SAB-104).
export async function checkListPermission(
  usuarioId: number | undefined,
  listaId: number
): Promise<{ status: number; error: string } | null> {
  if (!usuarioId) {
    return { status: 401, error: 'Usuario no autenticado.' };
  }

  const [usuario, lista] = await Promise.all([
    prisma.usuario.findUnique({
      where: { usuario_id: usuarioId },
      select: { usuario_id: true, rol: true },
    }),
    prisma.lista.findUnique({
      where: { lista_id: listaId },
      select: { creador_id: true },
    }),
  ]);

  if (!usuario) {
    return { status: 401, error: 'Usuario inexistente.' };
  }

  if (!lista) {
    return { status: 404, error: 'Lista no encontrada.' };
  }

  // NUEVO: verificar si el docente está asociado a la lista.
  const esDocenteDeLaLista = await prisma.lista_lectura.count({
    where: {
      lista_id: listaId,
      docente_id: usuario.usuario_id,
    },
  });

  // Administrador, creador o docente asociado tienen permiso.
  if (
    usuario.rol !== TipoRol.ADMINISTRADOR &&
    lista.creador_id !== usuario.usuario_id &&
    esDocenteDeLaLista === 0
  ) {
    return {
      status: 403,
      error: 'No tenés permisos para modificar esta lista.',
    };
  }

  return null;
}

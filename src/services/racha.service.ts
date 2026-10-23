// src/services/racha.service.ts
import { prisma } from '../db/connect/db';

export interface RachaEstado {
  rachaActual: number;
  recordRacha: number;
  ultimaFechaLectura: Date | null;
  haLeidoHoy: boolean;
}

const MILISEGUNDOS_HORA = 1000 * 60 * 60;
const HORAS_INTERVALO_MINIMO = 20; // Ventana para considerar lectura del día siguiente
const HORAS_LIMITE_GRACIA = 36;   // 24hs + 12hs de gracia

const esMismoDiaCalendario = (f1: Date, f2: Date): boolean => {
  return (
    f1.getFullYear() === f2.getFullYear() &&
    f1.getMonth() === f2.getMonth() &&
    f1.getDate() === f2.getDate()
  );
};

export class RachaService {
  static async obtenerRacha(usuarioId: number): Promise<RachaEstado> {
    const user = await prisma.usuario.findUnique({
      where: { usuario_id: usuarioId },
      select: {
        racha_actual: true,
        record_racha: true,
        ultima_fecha_lectura: true,
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    let rachaActual = user.racha_actual;
    const ahora = new Date();

    if (user.ultima_fecha_lectura) {
      const horasDesdeUltima =
        (ahora.getTime() - new Date(user.ultima_fecha_lectura).getTime()) /
        MILISEGUNDOS_HORA;

      // Si pasaron más de 36 horas, la racha expiró
      if (horasDesdeUltima > HORAS_LIMITE_GRACIA && rachaActual > 0) {
        rachaActual = 0;
        await prisma.usuario.update({
          where: { usuario_id: usuarioId },
          data: { racha_actual: 0 },
        });
      }
    }

    const haLeidoHoy = user.ultima_fecha_lectura
      ? esMismoDiaCalendario(ahora, new Date(user.ultima_fecha_lectura))
      : false;

    return {
      rachaActual,
      recordRacha: user.record_racha,
      ultimaFechaLectura: user.ultima_fecha_lectura,
      haLeidoHoy,
    };
  }

  static async registrarLectura(usuarioId: number): Promise<RachaEstado> {
    const ahora = new Date();

    return await prisma.$transaction(async (tx) => {
      const user = await tx.usuario.findUnique({
        where: { usuario_id: usuarioId },
        select: {
          racha_actual: true,
          record_racha: true,
          ultima_fecha_lectura: true,
        },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      let nuevaRacha = user.racha_actual;
      let nuevoRecord = user.record_racha;

      if (!user.ultima_fecha_lectura) {
        nuevaRacha = 1;
      } else {
        const horasDesdeUltima =
          (ahora.getTime() - new Date(user.ultima_fecha_lectura).getTime()) /
          MILISEGUNDOS_HORA;

        if (esMismoDiaCalendario(ahora, new Date(user.ultima_fecha_lectura))) {
          // Ya leyó hoy en día calendario
          return {
            rachaActual: user.racha_actual,
            recordRacha: user.record_racha,
            ultimaFechaLectura: user.ultima_fecha_lectura,
            haLeidoHoy: true,
          };
        } else if (horasDesdeUltima <= HORAS_LIMITE_GRACIA) {
          // Dentro de la ventana de gracia de 36 horas: suma a la racha
          nuevaRacha += 1;
        } else {
          // Expiró la ventana de gracia: reinicia en 1
          nuevaRacha = 1;
        }
      }

      if (nuevaRacha > nuevoRecord) {
        nuevoRecord = nuevaRacha;
      }

      const usuarioActualizado = await tx.usuario.update({
        where: { usuario_id: usuarioId },
        data: {
          racha_actual: nuevaRacha,
          record_racha: nuevoRecord,
          ultima_fecha_lectura: ahora,
        },
        select: {
          racha_actual: true,
          record_racha: true,
          ultima_fecha_lectura: true,
        },
      });

      return {
        rachaActual: usuarioActualizado.racha_actual,
        recordRacha: usuarioActualizado.record_racha,
        ultimaFechaLectura: usuarioActualizado.ultima_fecha_lectura,
        haLeidoHoy: true,
      };
    });
  }
}

export default RachaService;

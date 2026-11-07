import crypto from 'crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db/connect/db';

export const DIAS_VIGENCIA_INVITACION = 7;

export const generarTokenInvitacion = (): string => crypto.randomBytes(32).toString('hex');

export const calcularExpiracionInvitacion = (): Date => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + DIAS_VIGENCIA_INVITACION);
  return fecha;
};

export const buscarInvitacionPorTokenDB = async (token: string) => {
  return prisma.invitacion.findUnique({
    where: { token },
    include: {
      usuario: {
        select: {
          usuario_id: true,
          nombre: true,
          email: true,
          rol: true,
          estado_cuenta: true,
        },
      },
    },
  });
};

export const crearInvitacionDB = async (
  tx: Prisma.TransactionClient,
  usuario_id: number
) => {
  return tx.invitacion.create({
    data: {
      usuario_id,
      token: generarTokenInvitacion(),
      expira_en: calcularExpiracionInvitacion(),
    },
  });
};

export const invalidarInvitacionesDB = async (
  tx: Prisma.TransactionClient,
  usuario_id: number
) => {
  return tx.invitacion.updateMany({
    where: { usuario_id, usada: false },
    data: { usada: true },
  });
};

export const buscarCursoDB = async (anio: number, division: string, anio_lectivo: number) => {
  return prisma.curso.findUnique({
    where: {
      anio_division_anio_lectivo: { anio, division, anio_lectivo },
    },
  });
};

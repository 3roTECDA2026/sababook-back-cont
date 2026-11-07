import bcrypt from 'bcrypt';
import crypto from 'crypto';
import ExcelJS from 'exceljs';
import { prisma } from '../db/connect/db';
import {
  buscarCursoDB,
  buscarInvitacionPorTokenDB,
  crearInvitacionDB,
  invalidarInvitacionesDB,
} from '../models/invitation.model';

const SALT_ROUNDS = 10;
const MAX_FILAS = 500;

export class InvitationError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'InvitationError';
  }
}

export interface InvitacionGenerada {
  usuario_id: number;
  nombre: string;
  email: string;
  curso: string;
  link: string;
  expira_en: string;
  reinvitado: boolean;
}

export interface ErrorImportacion {
  fila: number;
  email: string;
  mensaje: string;
}

export interface ResultadoImportacion {
  total_filas: number;
  creados: number;
  reinvitados: number;
  errores: ErrorImportacion[];
  invitaciones: InvitacionGenerada[];
}

interface FilaPlanilla {
  fila: number;
  nombre: string;
  email: string;
  anio: number;
  division: string;
  anio_lectivo: number;
}

const normalizarTexto = (valor: unknown): string =>
  String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const validarEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const construirLink = (token: string): string => {
  const base = (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/+$/, '');
  return `${base}/activar/${token}`;
};

const parsearCurso = (
  curso: string,
  anioSeparado: string,
  divisionSeparada: string
): { anio: number; division: string } => {
  const anioTexto = anioSeparado.trim() || curso;
  const coincidencia = anioTexto.match(/^(\d{1,2})\s*[°º]?\s*[-–]?\s*([A-Za-z])?$/);

  if (!coincidencia) {
    throw new Error('El curso debe tener el formato 5°A o indicarse en las columnas anio y division.');
  }

  const anio = Number(coincidencia[1]);
  const division = (divisionSeparada.trim() || coincidencia[2] || '').toUpperCase();

  if (!Number.isInteger(anio) || anio < 1 || anio > 6) {
    throw new Error('El año del curso debe estar entre 1 y 6.');
  }
  if (!/^[A-Z]$/.test(division)) {
    throw new Error('La división del curso debe ser una letra, por ejemplo A.');
  }

  return { anio, division };
};

interface LecturaFilas {
  filas: FilaPlanilla[];
  errores: ErrorImportacion[];
}

const leerFilas = async (buffer: Buffer): Promise<LecturaFilas> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const hoja = workbook.worksheets[0];

  if (!hoja) {
    throw new InvitationError(400, 'La planilla no tiene hojas para leer.');
  }

  const columnas = new Map<string, number>();
  hoja.getRow(1).eachCell((cell, columna) => {
    columnas.set(normalizarTexto(cell.text), columna);
  });

  const columnaDe = (...nombres: string[]): number | undefined => {
    for (const nombre of nombres) {
      const columna = columnas.get(normalizarTexto(nombre));
      if (columna) return columna;
    }
    return undefined;
  };

  const colNombre = columnaDe('nombre', 'nombre y apellido');
  const colEmail = columnaDe('email', 'correo', 'mail', 'correo electronico');
  const colCurso = columnaDe('curso');
  const colAnio = columnaDe('anio', 'año');
  const colDivision = columnaDe('division', 'división');
  const colAnioLectivo = columnaDe('anio lectivo', 'año lectivo', 'ano lectivo');

  if (!colNombre || !colEmail) {
    throw new InvitationError(
      400,
      'La planilla debe tener las columnas "Nombre" y "Email".'
    );
  }
  if (!colCurso && (!colAnio || !colDivision)) {
    throw new InvitationError(
      400,
      'La planilla debe tener una columna "Curso" (ej. 5°A) o las columnas "Anio" y "Division".'
    );
  }

  const texto = (fila: ExcelJS.Row, columna: number | undefined): string =>
    columna ? fila.getCell(columna).text.trim() : '';

  const anioLectivoPorDefecto = new Date().getFullYear();
  const filas: FilaPlanilla[] = [];
  const errores: ErrorImportacion[] = [];

  hoja.eachRow((fila, numero) => {
    if (numero === 1) return;

    const nombre = texto(fila, colNombre);
    const email = texto(fila, colEmail).toLowerCase();
    const curso = texto(fila, colCurso);

    if (!nombre && !email && !curso) return;

    const anioLectivoTexto = texto(fila, colAnioLectivo);
    const anioLectivo = anioLectivoTexto ? Number(anioLectivoTexto) : anioLectivoPorDefecto;

    let anio: number;
    let division: string;
    try {
      ({ anio, division } = parsearCurso(
        curso,
        texto(fila, colAnio),
        texto(fila, colDivision)
      ));
    } catch {
      errores.push({
        fila: numero,
        email,
        mensaje: 'El curso debe tener el formato 5°A o indicarse en las columnas anio y division.',
      });
      return;
    }

    filas.push({ fila: numero, nombre, email, anio, division, anio_lectivo: anioLectivo });
  });

  const filasConDatos = filas.length + errores.length;
  if (filasConDatos === 0) {
    throw new InvitationError(400, 'La planilla no tiene alumnos para importar.');
  }
  if (filasConDatos > MAX_FILAS) {
    throw new InvitationError(400, `La planilla no puede superar las ${MAX_FILAS} filas.`);
  }

  return { filas, errores };
};

const validarFila = (fila: FilaPlanilla): string | null => {
  if (!fila.nombre) return 'Falta el nombre.';
  if (!fila.email) return 'Falta el email.';
  if (!validarEmail(fila.email)) return 'El email no es válido.';
  if (!Number.isInteger(fila.anio_lectivo) || fila.anio_lectivo < 2000) {
    return 'El año lectivo no es válido.';
  }
  return null;
};

class InvitationService {
  async importarPlanilla(buffer: Buffer): Promise<ResultadoImportacion> {
    const lectura = await leerFilas(buffer);
    const filas = lectura.filas;
    const resultado: ResultadoImportacion = {
      total_filas: filas.length + lectura.errores.length,
      creados: 0,
      reinvitados: 0,
      errores: [...lectura.errores],
      invitaciones: [],
    };
    const emailsEnPlanilla = new Set<string>();

    for (const fila of filas) {
      const error = validarFila(fila);
      if (error) {
        resultado.errores.push({ fila: fila.fila, email: fila.email, mensaje: error });
        continue;
      }

      if (emailsEnPlanilla.has(fila.email)) {
        resultado.errores.push({
          fila: fila.fila,
          email: fila.email,
          mensaje: 'El email está repetido en la planilla.',
        });
        continue;
      }
      emailsEnPlanilla.add(fila.email);

      try {
        const curso = await buscarCursoDB(fila.anio, fila.division, fila.anio_lectivo);
        if (!curso) {
          throw new Error(
            `No existe el curso ${fila.anio}°${fila.division} para el año lectivo ${fila.anio_lectivo}.`
          );
        }

        const existente = await prisma.usuario.findUnique({
          where: { email: fila.email },
          select: { usuario_id: true, rol: true, estado_cuenta: true },
        });

        if (existente) {
          if (existente.rol !== 'ALUMNO') {
            throw new Error('El email pertenece a un usuario que no es alumno.');
          }
          if (existente.estado_cuenta === 'ACTIVA') {
            throw new Error('El email ya tiene una cuenta activa.');
          }

          const invitacion = await prisma.$transaction(async (tx) => {
            await tx.usuario.update({
              where: { usuario_id: existente.usuario_id },
              data: { nombre: fila.nombre },
            });
            await tx.inscripcion.upsert({
              where: {
                usuario_id_anio_lectivo: {
                  usuario_id: existente.usuario_id,
                  anio_lectivo: fila.anio_lectivo,
                },
              },
              update: { curso_id: curso.curso_id, fecha_inscripcion: new Date() },
              create: {
                usuario_id: existente.usuario_id,
                curso_id: curso.curso_id,
                anio_lectivo: fila.anio_lectivo,
              },
            });
            await invalidarInvitacionesDB(tx, existente.usuario_id);
            return crearInvitacionDB(tx, existente.usuario_id);
          });

          resultado.reinvitados += 1;
          resultado.invitaciones.push({
            usuario_id: existente.usuario_id,
            nombre: fila.nombre,
            email: fila.email,
            curso: `${fila.anio}°${fila.division}`,
            link: construirLink(invitacion.token),
            expira_en: invitacion.expira_en.toISOString(),
            reinvitado: true,
          });
          continue;
        }

        const contrasenaTemporal = await bcrypt.hash(
          crypto.randomBytes(24).toString('hex'),
          SALT_ROUNDS
        );

        const { usuario, invitacion } = await prisma.$transaction(async (tx) => {
          const usuario = await tx.usuario.create({
            data: {
              nombre: fila.nombre,
              email: fila.email,
              contrasena: contrasenaTemporal,
              rol: 'ALUMNO',
              estado_cuenta: 'PENDIENTE',
            },
            select: { usuario_id: true, nombre: true, email: true },
          });

          await tx.inscripcion.create({
            data: {
              usuario_id: usuario.usuario_id,
              curso_id: curso.curso_id,
              anio_lectivo: fila.anio_lectivo,
            },
          });

          const invitacion = await crearInvitacionDB(tx, usuario.usuario_id);
          return { usuario, invitacion };
        });

        resultado.creados += 1;
        resultado.invitaciones.push({
          usuario_id: usuario.usuario_id,
          nombre: usuario.nombre,
          email: usuario.email,
          curso: `${fila.anio}°${fila.division}`,
          link: construirLink(invitacion.token),
          expira_en: invitacion.expira_en.toISOString(),
          reinvitado: false,
        });
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : String(error);
        resultado.errores.push({ fila: fila.fila, email: fila.email, mensaje });
      }
    }

    return resultado;
  }

  async validarToken(token: string) {
    const invitacion = await buscarInvitacionPorTokenDB(token);

    if (!invitacion || invitacion.usada) {
      throw new InvitationError(404, 'La invitación no es válida o ya fue utilizada.');
    }
    if (invitacion.expira_en.getTime() < Date.now()) {
      throw new InvitationError(410, 'La invitación venció. Pedí una nueva a la escuela.');
    }
    if (invitacion.usuario.estado_cuenta === 'ACTIVA') {
      throw new InvitationError(409, 'La cuenta ya está activa. Iniciá sesión con tu contraseña.');
    }

    return {
      valido: true,
      nombre: invitacion.usuario.nombre,
      email: invitacion.usuario.email,
      expira_en: invitacion.expira_en.toISOString(),
    };
  }

  async activarCuenta(token: string, contrasena: string) {
    if (!contrasena || contrasena.length < 6) {
      throw new InvitationError(400, 'La contraseña debe tener al menos 6 caracteres.');
    }

    const invitacion = await buscarInvitacionPorTokenDB(token);

    if (!invitacion || invitacion.usada) {
      throw new InvitationError(404, 'La invitación no es válida o ya fue utilizada.');
    }
    if (invitacion.expira_en.getTime() < Date.now()) {
      throw new InvitationError(410, 'La invitación venció. Pedí una nueva a la escuela.');
    }
    if (invitacion.usuario.estado_cuenta === 'ACTIVA') {
      throw new InvitationError(409, 'La cuenta ya está activa. Iniciá sesión con tu contraseña.');
    }

    const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);

    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { usuario_id: invitacion.usuario_id },
        data: { contrasena: hash, estado_cuenta: 'ACTIVA' },
      });
      await tx.invitacion.updateMany({
        where: { usuario_id: invitacion.usuario_id, usada: false },
        data: { usada: true },
      });
    });

    return {
      message: 'Cuenta activada. Ya podés iniciar sesión.',
      email: invitacion.usuario.email,
    };
  }
}

export const invitationService = new InvitationService();

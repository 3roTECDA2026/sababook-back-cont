// prisma/seed.ts
import 'dotenv/config';
import { PrismaClient, TipoRol } from '@prisma/client';
import bcrypt from 'bcrypt';
import { LIBROS_APL, PUNTAJE_POR_DEFECTO, PAGINAS_DE_PRUEBA } from './seed-data/apl-2026';

const prisma = new PrismaClient();

const ANIO_LECTIVO = 2026;
const PASSWORD = 'Test1234!';

// ---------- Protección: nunca contra producción ----------
function assertSafeEnvironment() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed abortado: NODE_ENV=production.');
  }
  let host = '';
  try {
    host = new URL(process.env.DATABASE_URL ?? '').hostname;
  } catch {
    throw new Error('Seed abortado: DATABASE_URL no es válida.');
  }
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(host);
  if (!isLocal && process.env.ALLOW_SEED !== 'true') {
    throw new Error(
      `Seed abortado: la base (${host}) no es local. ` +
        'Si es una base de PRUEBA propia, corré con ALLOW_SEED=true. ' +
        'Nunca lo uses contra la base compartida del equipo.'
    );
  }
}

// ---------- Materias ----------
async function seedMaterias() {
  const literatura = await prisma.materia.upsert({
    where: { nombre: 'Literatura' },
    update: {},
    create: { nombre: 'Literatura' },
  });
  return { literatura };
}

// ---------- Cursos: 1° a 6°, divisiones A y B ----------
async function seedCursos(materiaId: number) {
  const cursos = [];
  for (let anio = 1; anio <= 6; anio++) {
    for (const division of ['A', 'B']) {
      const curso = await prisma.curso.upsert({
        where: {
          anio_division_anio_lectivo: { anio, division, anio_lectivo: ANIO_LECTIVO },
        },
        update: {},
        create: { anio, division, anio_lectivo: ANIO_LECTIVO, materia_id: materiaId },
      });
      cursos.push(curso);
    }
  }
  return cursos;
}

// ---------- Usuarios ----------
const DOCENTES = [
  'Marta Ruiz', 'Carlos Peña', 'Lucía Ferreyra',
  'Hugo Sosa', 'Valeria Núñez', 'Diego Ledesma',
]; // ficticios: un docente por año (atiende A y B)

async function upsertUsuario(
  email: string, nombre: string, rol: TipoRol, hash: string
) {
  return prisma.usuario.upsert({
    where: { email },
    update: { nombre, rol, contrasena: hash },
    create: { email, nombre, rol, contrasena: hash, perfil_completo: true },
  });
}

async function seedUsuarios(cursos: { curso_id: number; anio: number; division: string }[]) {
  const hash = await bcrypt.hash(PASSWORD, 10);

  const admin = await upsertUsuario('admin@sababook.test', 'Admin Prueba', TipoRol.ADMINISTRADOR, hash);

  const docentes = [];
  for (let i = 0; i < DOCENTES.length; i++) {
    docentes.push(
      await upsertUsuario(`docente${i + 1}@sababook.test`, DOCENTES[i], TipoRol.DOCENTE, hash)
    );
  }

  // 2 alumnos por curso: alumno-1a-1, alumno-1a-2, ...
  const alumnos: { usuario_id: number; curso_id: number }[] = [];
  for (const curso of cursos) {
    for (let n = 1; n <= 2; n++) {
      const email = `alumno.${curso.anio}${curso.division.toLowerCase()}.${n}@sababook.test`;
      const u = await upsertUsuario(
        email, `Alumno ${curso.anio}°${curso.division} #${n}`, TipoRol.ALUMNO, hash
      );
      alumnos.push({ usuario_id: u.usuario_id, curso_id: curso.curso_id });
    }
  }
  return { admin, docentes, alumnos };
}

// ---------- Un docente por curso (SAB-117) ----------
async function seedCursoDocente(
  cursos: { curso_id: number; anio: number }[],
  docentes: { usuario_id: number }[]
) {
  for (const curso of cursos) {
    const docente = docentes[curso.anio - 1];
    const existente = await prisma.curso_docente.findUnique({ where: { curso_id: curso.curso_id } });
    if (existente) continue; // ya tiene docente: no se pisa
    await prisma.curso_docente.create({
      data: { curso_id: curso.curso_id, usuario_id: docente.usuario_id },
    });
  }
}

// ---------- Libros, asignación a cursos e historial ----------
// libro no tiene clave única: se busca por título y autor para no duplicar.
async function seedLibrosYAsignaciones(
  cursos: { curso_id: number; anio: number }[],
  adminId: number
) {
  for (const curso of cursos) {
    const nivel = curso.anio <= 3 ? 'Básico' : 'Superior';

    for (const datos of LIBROS_APL[curso.anio] ?? []) {
      let libro = await prisma.libro.findFirst({
        where: { titulo: datos.titulo, autor: datos.autor },
      });
      if (!libro) {
        libro = await prisma.libro.create({
          data: {
            ...datos,
            nivel_educativo: nivel,
            paginas_totales: PAGINAS_DE_PRUEBA,
          },
        });
      }

      const yaAsignado = await prisma.curso_libro.findUnique({
        where: { curso_id_libro_id: { curso_id: curso.curso_id, libro_id: libro.libro_id } },
      });
      if (yaAsignado) continue; // no se pisa el puntaje ni se repite el historial

      // Igual que la app: la asignación y su registro en el historial van juntos
      await prisma.$transaction([
        prisma.curso_libro.create({
          data: {
            curso_id: curso.curso_id,
            libro_id: libro.libro_id,
            puntaje: PUNTAJE_POR_DEFECTO,
          },
        }),
        prisma.historial_asignacion.create({
          data: {
            curso_id: curso.curso_id,
            libro_id: libro.libro_id,
            usuario_id: adminId,
            anio_lectivo: ANIO_LECTIVO,
            accion: 'ASIGNADO',
            puntaje: PUNTAJE_POR_DEFECTO,
          },
        }),
      ]);
    }
  }
}

// ---------- Inscripciones ----------
// inscripcion tiene @@unique([usuario_id, anio_lectivo]): un alumno, un curso por año.
async function seedInscripciones(alumnos: { usuario_id: number; curso_id: number }[]) {
  for (const alumno of alumnos) {
    await prisma.inscripcion.upsert({
      where: {
        usuario_id_anio_lectivo: {
          usuario_id: alumno.usuario_id,
          anio_lectivo: ANIO_LECTIVO,
        },
      },
      update: {},
      create: {
        usuario_id: alumno.usuario_id,
        curso_id: alumno.curso_id,
        anio_lectivo: ANIO_LECTIVO,
      },
    });
  }
}

async function main() {
  assertSafeEnvironment();

  const { literatura } = await seedMaterias();
  const cursos = await seedCursos(literatura.materia_id);
  const { admin, docentes, alumnos } = await seedUsuarios(cursos);
  await seedCursoDocente(cursos, docentes);
  await seedLibrosYAsignaciones(cursos, admin.usuario_id);
  await seedInscripciones(alumnos);
  await seedFavoritos(alumnos);
  await seedConfiguracion();

  console.log('Seed (bloques 1, 2 y 3) listo.');
}

// ---------- Favoritos y estados de lectura ----------
// es_favorito (corazón) y estado_lectura son independientes (SAB-87).
async function seedFavoritos(alumnos: { usuario_id: number; curso_id: number }[]) {
  const casos = [
    { estado: 'leido', esFavorito: true },
    { estado: 'leyendo', esFavorito: false },
    { estado: 'quiero-leer', esFavorito: false },
    { estado: 'general', esFavorito: true },
  ];

  for (const alumno of alumnos) {
    const asignados = await prisma.curso_libro.findMany({
      where: { curso_id: alumno.curso_id },
      orderBy: { libro_id: 'asc' },
      take: casos.length,
    });

    for (let i = 0; i < asignados.length; i++) {
      const { estado, esFavorito } = casos[i];
      await prisma.favorito.upsert({
        where: {
          usuario_id_libro_id: {
            usuario_id: alumno.usuario_id,
            libro_id: asignados[i].libro_id,
          },
        },
        update: {},
        create: {
          usuario_id: alumno.usuario_id,
          libro_id: asignados[i].libro_id,
          estado_lectura: estado,
          es_favorito: esFavorito,
        },
      });
    }
  }
}

// ---------- Configuración ----------
async function seedConfiguracion() {
  await prisma.configuracion_sistema.upsert({
    where: { clave: 'puntaje_minimo_anual' },
    update: {},
    create: {
      clave: 'puntaje_minimo_anual',
      valor: '140',
      descripcion: 'Puntos mínimos que un alumno debe juntar por año lectivo.',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
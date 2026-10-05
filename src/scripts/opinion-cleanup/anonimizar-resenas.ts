// src/scripts/opinion-cleanup/anonimizar-resenas.ts
//
// SAB-039 - Anonimiza o elimina reseñas de prueba identificadas con
// detectar-resenas-prueba.ts. Por defecto NO hace nada: exige --ids.
//
// Uso:
//   # Ver qué pasa, sin tocar nada (dry-run implícito):
//   npx tsx src/scripts/opinion-cleanup/anonimizar-resenas.ts --ids 58,59,60
//
//   # Ejecutar de verdad, anonimizando (conserva el usuario y la calificación):
//   npx tsx src/scripts/opinion-cleanup/anonimizar-resenas.ts --ids 58,59,60 --modo anonimizar --confirmar
//
//   # Ejecutar de verdad, borrando la fila entera:
//   npx tsx src/scripts/opinion-cleanup/anonimizar-resenas.ts --ids 58,59,60 --modo borrar --confirmar
//
// La opción preferida es `anonimizar`: deja de mostrarse el texto basura en
// /bookdetails/<id> sin romper el promedio de calificación del libro ni las
// medallas ya desbloqueadas. Usar `borrar` solo cuando el usuario sea de prueba.

import 'dotenv/config';
import { prisma } from '../../db/connect/db';

type Modo = 'anonimizar' | 'borrar';

const arg = (flag: string): string | undefined => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : undefined;
};

const parseIds = (): number[] => {
  const raw = arg('--ids');
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n) && n > 0);
};

const modo = ((): Modo => (arg('--modo') === 'borrar' ? 'borrar' : 'anonimizar'))();
const confirmar = process.argv.includes('--confirmar');

const PLACEHOLDER_FINAL = '[Reseña retirada por moderación]';

const main = async () => {
  const ids = parseIds();

  if (ids.length === 0) {
    console.error(
      'Faltan IDs. Ejemplo:\n' +
        '  npx tsx src/scripts/opinion-cleanup/anonimizar-resenas.ts --ids 58,59,60',
    );
    process.exit(1);
  }

  const opinions = await prisma.opinion.findMany({
    where: { opinion_id: { in: ids } },
    include: {
      usuario: { select: { nombre: true } },
      libro: { select: { titulo: true } },
    },
    orderBy: { opinion_id: 'asc' },
  });

  const encontrados = new Set(opinions.map((o) => o.opinion_id));
  const noEncontrados = ids.filter((id) => !encontrados.has(id));

  console.log(`\n=== SAB-039 · Anonimización de reseñas (modo: ${modo}) ===`);
  console.log(`IDs solicitados: ${ids.length} · encontrados: ${opinions.length}\n`);

  for (const o of opinions) {
    console.log(
      `  id=${String(o.opinion_id).padStart(4)} | libro ${String(o.libro_id).padStart(3)} ` +
        `| usuario ${String(o.usuario_id).padStart(3)} ${(o.usuario?.nombre ?? '').padEnd(18).slice(0, 18)} ` +
        `| cal=${String(o.calificacion ?? '-').padStart(2)} | "${(o.comentario ?? '').slice(0, 34)}"`,
    );
  }

  if (noEncontrados.length > 0) {
    console.log(`\n  IDs no encontrados en la base: ${noEncontrados.join(', ')}`);
  }

  if (!confirmar) {
    console.log('\nDry-run: no se modificó nada. Para aplicar, agregar --confirmar.\n');
    await prisma.$disconnect();
    return;
  }

  const encontradosIds = opinions.map((o) => o.opinion_id);

  if (modo === 'borrar') {
    const { count } = await prisma.opinion.deleteMany({
      where: { opinion_id: { in: encontradosIds } },
    });
    console.log(`\nBorradas ${count} reseñas.`);
  } else {
    const { count } = await prisma.opinion.updateMany({
      where: { opinion_id: { in: encontradosIds } },
      data: { comentario: PLACEHOLDER_FINAL },
    });
    console.log(`\nAnonimizadas ${count} reseñas (comentario reemplazado por placeholder).`);
    console.log('Las calificaciones y los usuarios se conservaron.');
  }

  console.log(
    '\nRecordatorio: /bookdetails/9 se cachea en el navegador. Recargar con Ctrl+Shift+R para verificar.\n',
  );

  await prisma.$disconnect();
};

main().catch(async (error) => {
  console.error('Error en la anonimización:', error);
  await prisma.$disconnect();
  process.exit(1);
});
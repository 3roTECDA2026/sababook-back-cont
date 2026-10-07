// src/scripts/opinion-cleanup/detectar-resenas-prueba.ts
//
// SAB-039 - Detecta reseñas con contenido de prueba en la tabla `opinion`.
// SCRIPT DE SOLO LECTURA: no modifica nada.
//
// Uso:
//   npx tsx src/scripts/opinion-cleanup/detectar-resenas-prueba.ts
//   npx tsx src/scripts/opinion-cleanup/detectar-resenas-prueba.ts --libro 9
//
// Revisar el reporte y, sobre los IDs confirmados, correr anonimizar-resenas.ts.

import 'dotenv/config';
import { prisma } from '../../db/connect/db';

type Confianza = 'alta' | 'media';

interface Sospechosa {
  opinion_id: number;
  usuario_id: number;
  usuario_nombre: string;
  libro_id: number;
  libro_titulo: string;
  calificacion: number | null;
  comentario: string;
  fecha: Date | null;
  confianza: Confianza;
  motivos: string[];
}

const CON_VOCALES = /[aeiouáéíóúüñ]/;

const argLibro = (() => {
  const i = process.argv.indexOf('--libro');
  return i > -1 ? Number(process.argv[i + 1]) : undefined;
})();

/** Sin vocales y con caracteres alfanuméricos: no es español, es teclado golpeado. */
const esAtaqueTeclado = (texto: string): boolean => {
  const limpio = texto.toLowerCase().replace(/[^a-záéíóúüñ0-9]/g, '');
  if (limpio.length < 3) return false;
  return !CON_VOCALES.test(limpio);
};

/** Un mismo carácter repetido: "ffff", "jjjj". */
const esCaracterRepetido = (texto: string): boolean => {
  const limpio = texto.toLowerCase().replace(/\s/g, '');
  return limpio.length >= 3 && new Set(limpio).size === 1;
};

/** Bloque corto repetido: "ñiñiñi", "siiii", "ababab". */
const esBloqueRepetido = (texto: string): boolean => {
  const limpio = texto.toLowerCase().replace(/\s/g, '');
  if (limpio.length < 4) return false;
  if (new Set(limpio).size <= 2) return true;
  for (let largo = 1; largo <= 3; largo++) {
    if (limpio.length % largo !== 0) continue;
    const bloque = limpio.slice(0, largo);
    if (limpio === bloque.repeat(limpio.length / largo)) return true;
  }
  return false;
};

/** Racha de la misma letra: "siiii", "holaaa". Coincide con el servicio (solo letras). */
const tieneRacha = (texto: string): boolean => /([a-záéíóúüñ])\1{2,}/.test(texto);

/** Solo dígitos: "123", "4564132451". */
const esSoloNumeros = (texto: string): boolean => /^\d+$/.test(texto.trim());

const MOTIVOS_MINIMOS = [
  'longitud menor a 5 caracteres',
  'longitud menor a 10 caracteres',
];

const analizar = (comentario: string): { confianza: Confianza; motivos: string[] } => {
  const texto = comentario.trim();
  const motivos: string[] = [];
  let confianza: Confianza = 'media';

  if (texto.length < 5) motivos.push(MOTIVOS_MINIMOS[0]);
  else if (texto.length < 10) motivos.push(MOTIVOS_MINIMOS[1]);

  const teclado = esAtaqueTeclado(texto);
  const repetido = esCaracterRepetido(texto);
  const bloque = esBloqueRepetido(texto);
  const racha = tieneRacha(texto);
  const numeros = esSoloNumeros(texto);

  if (teclado) motivos.push('sin vocales, secuencia sin palabras reales');
  if (repetido) motivos.push('un solo carácter repetido');
  if (bloque) motivos.push('bloque repetido');
  if (racha) motivos.push('racha de un mismo carácter');
  if (numeros) motivos.push('solo números');

  if (teclado || repetido || bloque || racha || numeros) confianza = 'alta';

  return { confianza, motivos };
};

const main = async () => {
  const opiniones = await prisma.opinion.findMany({
    include: {
      usuario: { select: { nombre: true } },
      libro: { select: { titulo: true } },
    },
    orderBy: { fecha: 'asc' },
  });

  const filtradas = argLibro
    ? opiniones.filter((o) => o.libro_id === argLibro)
    : opiniones;

  const sospechosas: Sospechosa[] = [];

  for (const o of filtradas) {
    const comentario = (o.comentario ?? '').trim();
    const { confianza, motivos } = analizar(comentario);
    if (motivos.length === 0) continue;

    sospechosas.push({
      opinion_id: o.opinion_id,
      usuario_id: o.usuario_id,
      usuario_nombre: o.usuario?.nombre ?? '',
      libro_id: o.libro_id,
      libro_titulo: o.libro?.titulo ?? '',
      calificacion: o.calificacion,
      comentario,
      fecha: o.fecha,
      confianza,
      motivos,
    });
  }

  const total = filtradas.length;
  const alta = sospechosas.filter((s) => s.confianza === 'alta');
  const media = sospechosas.filter((s) => s.confianza === 'media');

  console.log(`\n=== SAB-039 · Revisión de reseñas${argLibro ? ` (libro ${argLibro})` : ''} ===`);
  console.log(`Reseñas revisadas: ${total}`);
  console.log(`Sospechosas: ${sospechosas.length} (alta: ${alta.length} · media: ${media.length})\n`);

  for (const [nivel, lista] of [
    ['ALTA', alta],
    ['MEDIA', media],
  ] as const) {
    if (lista.length === 0) continue;
    console.log(`--- Confianza ${nivel} (${lista.length}) ---`);
    for (const s of lista) {
      console.log(
        `  id=${String(s.opinion_id).padStart(4)} | libro ${String(s.libro_id).padStart(3)} ` +
          `| ${String(s.usuario_id).padStart(3)} ${s.usuario_nombre.padEnd(18).slice(0, 18)} ` +
          `| "${s.comentario.slice(0, 34)}" | ${s.motivos.join('; ')}`,
      );
    }
    console.log('');
  }

  const porLibro = new Map<number, number>();
  for (const s of sospechosas) porLibro.set(s.libro_id, (porLibro.get(s.libro_id) ?? 0) + 1);
  const top = [...porLibro.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  console.log('Libros más afectados:');
  for (const [libroId, count] of top) {
    console.log(`  libro ${libroId}: ${count} reseñas sospechosas`);
  }

  console.log(
    `\nNinguna fila fue modificada. Para limpiar, revisar los IDs y correr:\n` +
      `  npx tsx src/scripts/opinion-cleanup/anonimizar-resenas.ts --ids 1,2,3\n`,
  );

  await prisma.$disconnect();
};

main().catch(async (error) => {
  console.error('Error en la detección:', error);
  await prisma.$disconnect();
  process.exit(1);
});
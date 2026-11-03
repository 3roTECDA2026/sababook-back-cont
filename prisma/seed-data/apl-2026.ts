// prisma/seed-data/apl-2026.ts
// Libros de las listas del APL 2026, por año (valen para las divisiones A y B).

export interface LibroSeed {
  titulo: string;
  autor: string;
  genero: string;
  descripcion: string;
}

// Pendiente de confirmar con el equipo: hoy todos los libros valen 10.
export const PUNTAJE_POR_DEFECTO = 10;

// Valor de prueba: no es la cantidad real de páginas de cada edición.
export const PAGINAS_DE_PRUEBA = 200;

export const LIBROS_APL: Record<number, LibroSeed[]> = {
  1: [
    { titulo: `Matilda`, autor: `Roald Dahl`, genero: `Novela`, descripcion: `Novela clásica infantil.` },
    // ...pegá acá el resto de 1°
  ],
  2: [
    { titulo: `El mago de oz`, autor: `Lyman Frank Baum`, genero: `Novela`, descripcion: `Novela de fantasía clásica.` },
    // ...
  ],
  3: [
    { titulo: `Estudio en escarlata`, autor: `Arthur Conan Doyle`, genero: `Novela`, descripcion: `Primera novela de Sherlock Holmes.` },
    // ...
  ],
  4: [
    { titulo: `Orgullo y prejuicio`, autor: `J. Austin`, genero: `Novela`, descripcion: `Novela clásica.` },
    // ...
  ],
  5: [
    { titulo: `Yo, robot`, autor: `Isaac Asimov`, genero: `Cuentos`, descripcion: `Relatos de ciencia ficción.` },
    // ...
  ],
  6: [
    { titulo: `Ficciones`, autor: `Jorge Luis Borges`, genero: `Relatos`, descripcion: `Relatos clásicos.` },
    // ...
  ],
};
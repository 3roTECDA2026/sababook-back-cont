import { TipoRol } from '@prisma/client';
import { ErrorNegocio } from './course.service';
import {
  CursoPanel,
  obtenerCursosDelPanelDB,
  obtenerFavoritosDeAlumnosDB,
  obtenerLibrosAsignadosDB,
} from '../models/teacherPanel.model';

// Días en "Leyendo" sin cambios a partir de los cuales un libro se considera abandonado
export const DIAS_ABANDONO_POR_DEFECTO = 30;

const LIMITE_RANKING = 10;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

interface LibroElegido {
  libro_id: number;
  titulo: string;
  autor: string;
  portada_url: string | null;
  asignado: boolean;
  alumnos: number;
  leyendo: number;
  leidos: number;
}

interface LibroAbandonado {
  usuario_id: number;
  alumno: string;
  curso_id: number;
  libro_id: number;
  titulo: string;
  autor: string;
  portada_url: string | null;
  asignado: boolean;
  fecha_estado: Date;
  dias_leyendo: number;
}

export interface PanelDocente {
  cursos: CursoPanel[];
  resumen: {
    cantidad_alumnos: number;
    cantidad_favoritos: number;
    cantidad_abandonados: number;
    dias_abandono: number;
  };
  libros_mas_elegidos: LibroElegido[];
  generos_mas_elegidos: { genero: string; cantidad: number }[];
  abandonados: LibroAbandonado[];
}

class TeacherPanelService {
  async obtenerPanel(
    usuario_id: number,
    rol: TipoRol,
    curso_id: number | null,
    dias: number
  ): Promise<PanelDocente> {
    const cursos = await obtenerCursosDelPanelDB(usuario_id, rol);

    if (curso_id !== null && !cursos.some((c) => c.curso_id === curso_id)) {
      throw new ErrorNegocio(403, 'No tenés acceso a ese curso.');
    }

    const cursoIds = curso_id !== null ? [curso_id] : cursos.map((c) => c.curso_id);

    const [{ cantidad_alumnos, favoritos }, asignados] = await Promise.all([
      obtenerFavoritosDeAlumnosDB(cursoIds),
      obtenerLibrosAsignadosDB(cursoIds),
    ]);
    const librosAsignados = new Set(asignados);
    const ahora = Date.now();
    // "Elegidos" = libros marcados con el corazón (es_favorito). Marcar un libro como
    // leído ya no cuenta como favorito ni infla el ranking (SAB-087). Los "abandonados",
    // en cambio, se miden por estado de lectura, sin importar si es favorito.
    const elegidos = favoritos.filter((f) => f.es_favorito);
    // Libros más elegidos: cuántos alumnos lo tienen en favoritos y en qué estado
    const porLibro = new Map<number, LibroElegido>();
    for (const f of elegidos) {
      const libro = porLibro.get(f.libro_id) ?? {
        libro_id: f.libro_id,
        titulo: f.titulo,
        autor: f.autor,
        portada_url: f.portada_url,
        asignado: librosAsignados.has(f.libro_id),
        alumnos: 0,
        leyendo: 0,
        leidos: 0,
      };
      libro.alumnos += 1;
      if (f.estado_lectura === 'leyendo') libro.leyendo += 1;
      if (f.estado_lectura === 'leido') libro.leidos += 1;
      porLibro.set(f.libro_id, libro);
    }

    // Géneros más elegidos
    const porGenero = new Map<string, number>();
    for (const f of elegidos) {
      const genero = f.genero?.trim() || 'Sin género';
      porGenero.set(genero, (porGenero.get(genero) ?? 0) + 1);
    }

    // Abandonados: siguen en "leyendo" sin cambios desde hace más de `dias` días
    const limite = ahora - dias * MS_POR_DIA;
    const abandonados = favoritos
      .filter((f) => f.estado_lectura === 'leyendo' && f.fecha_estado.getTime() < limite)
      .map((f) => ({
        usuario_id: f.usuario_id,
        alumno: f.alumno,
        curso_id: f.curso_id,
        libro_id: f.libro_id,
        titulo: f.titulo,
        autor: f.autor,
        portada_url: f.portada_url,
        asignado: librosAsignados.has(f.libro_id),
        fecha_estado: f.fecha_estado,
        dias_leyendo: Math.floor((ahora - f.fecha_estado.getTime()) / MS_POR_DIA),
      }))
      .sort((a, b) => b.dias_leyendo - a.dias_leyendo);

    return {
      cursos,
      resumen: {
        cantidad_alumnos,
        cantidad_favoritos: elegidos.length,
        cantidad_abandonados: abandonados.length,
        dias_abandono: dias,
      },
      libros_mas_elegidos: [...porLibro.values()]
        .sort((a, b) => b.alumnos - a.alumnos)
        .slice(0, LIMITE_RANKING),
      generos_mas_elegidos: [...porGenero]
        .map(([genero, cantidad]) => ({ genero, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, LIMITE_RANKING),
      abandonados,
    };
  }
}

export const teacherPanelService = new TeacherPanelService();

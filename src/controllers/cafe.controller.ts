// src/controllers/cafe.controller.ts
import { Request, Response } from 'express';
import {
  crearCafeDB,
  obtenerCafesDB,
  obtenerCafePorIdDB,
  actualizarCafeDB,
  eliminarCafeDB,
  registrarAsistenciaDB,
  eliminarAsistenciaDB,
  obtenerAsistenciaUsuarioDB,
  obtenerAsistentesCafeDB,
  registrarVotoDB,
  obtenerVotoUsuarioDB,
} from '../models/cafe.model';

// Crear un Café Literario
export const crearCafe = async (req: Request, res: Response) => {
  try {
    const { titulo, descripcion, libro_id, docente_id, fecha_evento, lugar } = req.body;

    if (!titulo || !fecha_evento) {
      return res.status(400).json({ mensaje: 'El título y la fecha del evento son obligatorios' });
    }

    const nuevoCafe = await crearCafeDB({
      titulo,
      descripcion,
      libro_id,
      docente_id,
      fecha_evento,
      lugar,
    });

    res.status(201).json({
      mensaje: 'Café Literario creado correctamente',
      cafe: nuevoCafe,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Error al crear Café Literario:', error);
    res.status(500).json({ mensaje: 'Error interno al crear Café Literario', detalle: message });
  }
};

// Obtener todos los Cafés Literarios
export const obtenerCafes = async (req: Request, res: Response) => {
  try {
    const { usuario_id } = req.query;
    const cafes = await obtenerCafesDB(usuario_id ? parseInt(String(usuario_id)) : null);
    res.json(cafes);
  } catch (error) {
    console.error('❌ Error al obtener Cafés Literarios:', error);
    res.status(500).json({ mensaje: 'Error interno al obtener los Cafés Literarios' });
  }
};

// Obtener un Café Literario por ID
export const obtenerCafe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { usuario_id } = req.query;

    const cafe = await obtenerCafePorIdDB(parseInt(String(id)));
    if (!cafe) {
      return res.status(404).json({ mensaje: 'Café Literario no encontrado' });
    }

    let asistencia_usuario: string | null = null;
    let voto_usuario: boolean | null = null;

    if (usuario_id) {
      const asistencia = await obtenerAsistenciaUsuarioDB(parseInt(String(id)), parseInt(String(usuario_id)));
      const voto = await obtenerVotoUsuarioDB(parseInt(String(id)), parseInt(String(usuario_id)));
      asistencia_usuario = asistencia ? asistencia.estado : null;
      voto_usuario = voto ? voto.voto : null;
    }

    res.json({
      ...cafe,
      asistencia_usuario,
      voto_usuario,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Error al obtener Café Literario:', error);
    res.status(500).json({ mensaje: 'Error al obtener el Café Literario', detalle: message });
  }
};

// Actualizar un Café Literario
export const actualizarCafe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, libro_id, fecha_evento, lugar, estado } = req.body;

    const cafeActualizado = await actualizarCafeDB(parseInt(String(id)), {
      titulo,
      descripcion,
      libro_id,
      fecha_evento,
      lugar,
      estado,
    });

    if (!cafeActualizado) {
      return res.status(404).json({ mensaje: 'Café Literario no encontrado' });
    }

    res.json({ mensaje: 'Café Literario actualizado correctamente', cafe: cafeActualizado });
  } catch (error) {
    console.error('❌ Error al actualizar Café Literario:', error);
    res.status(500).json({ mensaje: 'Error al actualizar Café Literario' });
  }
};

// Eliminar un Café Literario
export const eliminarCafe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const eliminado = await eliminarCafeDB(parseInt(String(id)));

    if (!eliminado) {
      return res.status(404).json({ mensaje: 'Café Literario no encontrado' });
    }

    res.json({ mensaje: 'Café Literario eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar Café Literario:', error);
    res.status(500).json({ mensaje: 'Error al eliminar Café Literario' });
  }
};

// ----------------- ASISTENCIA -----------------

// Confirmar o cambiar estado de asistencia
export const toggleAsistencia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // cafe_id
    const { usuario_id, estado = 'confirmado' } = req.body;

    if (!usuario_id) {
      return res.status(400).json({ mensaje: 'Se requiere usuario_id' });
    }

    const asistenciaExistente = await obtenerAsistenciaUsuarioDB(parseInt(String(id)), parseInt(String(usuario_id)));

    // Si ya tenía el mismo estado y vuelve a apretar, hacemos toggle a cancelar
    if (asistenciaExistente && asistenciaExistente.estado === estado) {
      await eliminarAsistenciaDB(parseInt(String(id)), parseInt(String(usuario_id)));
      return res.json({ mensaje: 'Asistencia cancelada', estado: null });
    }

    const nuevaAsistencia = await registrarAsistenciaDB(
      parseInt(String(id)),
      parseInt(String(usuario_id)),
      estado
    );
    res.json({ mensaje: 'Asistencia registrada correctamente', asistencia: nuevaAsistencia });
  } catch (error) {
    console.error('❌ Error al gestionar asistencia:', error);
    res.status(500).json({ mensaje: 'Error al gestionar la asistencia' });
  }
};

// Obtener lista de asistentes (para docentes/admins)
export const obtenerAsistentes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const asistentes = await obtenerAsistentesCafeDB(parseInt(String(id)));
    res.json(asistentes);
  } catch (error) {
    console.error('❌ Error al obtener asistentes:', error);
    res.status(500).json({ mensaje: 'Error al obtener la lista de asistentes' });
  }
};

// ----------------- VOTACIÓN POST-LECTURA -----------------

// Emitir un voto post-lectura (¿Te gustó el libro?)
export const votarCafe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // cafe_id
    const { usuario_id, voto } = req.body; // voto: true o false

    if (!usuario_id || typeof voto !== 'boolean') {
      return res.status(400).json({ mensaje: 'usuario_id y voto (boolean true/false) son obligatorios' });
    }

    const votoRegistrado = await registrarVotoDB(
      parseInt(String(id)),
      parseInt(String(usuario_id)),
      voto
    );
    res.json({ mensaje: 'Voto registrado con éxito', voto: votoRegistrado });
  } catch (error) {
    console.error('❌ Error al registrar voto:', error);
    res.status(500).json({ mensaje: 'Error al registrar la votación' });
  }
};
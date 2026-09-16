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
  obtenerVotoUsuarioDB
} from '../models/cafe.model.js';

// Crear un Café Literario
export const crearCafe = async (req, res) => {
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
      lugar
    });

    res.status(201).json({
      mensaje: 'Café Literario creado correctamente',
      cafe: nuevoCafe
    });
  } catch (error) {
    console.error('❌ Error al crear Café Literario:', error);
    res.status(500).json({ mensaje: 'Error interno al crear Café Literario', detalle: error.message });
  }
};

// Obtener todos los Cafés Literarios
export const obtenerCafes = async (req, res) => {
  try {
    const { usuario_id } = req.query;
    const cafes = await obtenerCafesDB(usuario_id ? parseInt(usuario_id) : null);
    res.json(cafes);
  } catch (error) {

    console.error('❌ Error al obtener Cafés Literarios:', error);
    res.status(500).json({ mensaje: 'Error interno al obtener los Cafés Literarios' });
  }
};

// Obtener un Café Literario por ID
export const obtenerCafe = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id } = req.query;

    const cafe = await obtenerCafePorIdDB(parseInt(id));
    if (!cafe) {
      return res.status(404).json({ mensaje: 'Café Literario no encontrado' });
    }

    let asistenciaUsuario = null;
    let votoUsuario = null;

    if (usuario_id) {
      asistenciaUsuario = await obtenerAsistenciaUsuarioDB(parseInt(id), parseInt(usuario_id));
      votoUsuario = await obtenerVotoUsuarioDB(parseInt(id), parseInt(usuario_id));
    }

    res.json({
      ...cafe,
      asistencia_usuario: asistenciaUsuario ? asistenciaUsuario.estado : null,
      voto_usuario: votoUsuario ? votoUsuario.voto : null
    });
  } catch (error) {
    console.error('❌ Error al obtener Café Literario:', error);
    res.status(500).json({ mensaje: 'Error al obtener el Café Literario', detalle: error.message });
  }
};

// Actualizar un Café Literario
export const actualizarCafe = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, libro_id, fecha_evento, lugar, estado } = req.body;

    const cafeActualizado = await actualizarCafeDB(parseInt(id), {
      titulo,
      descripcion,
      libro_id,
      fecha_evento,
      lugar,
      estado
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
export const eliminarCafe = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await eliminarCafeDB(parseInt(id));

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
export const toggleAsistencia = async (req, res) => {
  try {
    const { id } = req.params; // cafe_id
    const { usuario_id, estado = 'confirmado' } = req.body;

    if (!usuario_id) {
      return res.status(400).json({ mensaje: 'Se requiere usuario_id' });
    }

    const asistenciaExistente = await obtenerAsistenciaUsuarioDB(parseInt(id), parseInt(usuario_id));

    // Si ya tenía confirmado y vuelve a apretar, podemos hacer toggle a cancelar
    if (asistenciaExistente && asistenciaExistente.estado === estado) {
      await eliminarAsistenciaDB(parseInt(id), parseInt(usuario_id));
      return res.json({ mensaje: 'Asistencia cancelada', estado: null });
    }

    const nuevaAsistencia = await registrarAsistenciaDB(parseInt(id), parseInt(usuario_id), estado);
    res.json({ mensaje: 'Asistencia registrada correctamente', asistencia: nuevaAsistencia });
  } catch (error) {
    console.error('❌ Error al gestionar asistencia:', error);
    res.status(500).json({ mensaje: 'Error al gestionar la asistencia' });
  }
};

// Obtener lista de asistentes (para docentes/admins)
export const obtenerAsistentes = async (req, res) => {
  try {
    const { id } = req.params;
    const asistentes = await obtenerAsistentesCafeDB(parseInt(id));
    res.json(asistentes);
  } catch (error) {
    console.error('❌ Error al obtener asistentes:', error);
    res.status(500).json({ mensaje: 'Error al obtener la lista de asistentes' });
  }
};

// ----------------- VOTACIÓN POST-LECTURA -----------------

// Emita un voto post-lectura (¿Te gustó el libro?)
export const votarCafe = async (req, res) => {
  try {
    const { id } = req.params; // cafe_id
    const { usuario_id, voto } = req.body; // voto: true o false

    if (!usuario_id || typeof voto !== 'boolean') {
      return res.status(400).json({ mensaje: 'usuario_id y voto (boolean true/false) son obligatorios' });
    }

    const votoRegistrado = await registrarVotoDB(parseInt(id), parseInt(usuario_id), voto);
    res.json({ mensaje: 'Voto registrado con éxito', voto: votoRegistrado });
  } catch (error) {
    console.error('❌ Error al registrar voto:', error);
    res.status(500).json({ mensaje: 'Error al registrar la votación' });
  }
};

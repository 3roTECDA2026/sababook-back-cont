// server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";

// src/routes/auth.routes.ts
import { Router } from "express";

// src/db/connect/db.ts
import { PrismaClient } from "@prisma/client";
var prisma = global.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
});
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
var testConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("\u2705 Database connection established (Prisma / Supabase)");
    return prisma;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("\u274C Supabase database connection failed:", message);
    throw error;
  }
};

// src/models/auth.model.ts
var AuthModel = class {
  async getUserByEmail(email) {
    try {
      const user = await prisma.usuario.findUnique({
        where: { email },
        select: {
          usuario_id: true,
          nombre: true,
          email: true,
          contrasena: true,
          rol_id: true
        }
      });
      if (!user || user.rol_id === null) {
        return null;
      }
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error in AuthModel.getUserByEmail:", message);
      throw new Error("Failed to retrieve user by email");
    }
  }
};
var auth_model_default = new AuthModel();

// src/models/user.model.ts
import bcrypt from "bcrypt";
var UserModel = class {
  async getAllUsers() {
    try {
      const users = await prisma.usuario.findMany({
        include: {
          rol: {
            select: {
              nombre_rol: true
            }
          }
        },
        orderBy: {
          usuario_id: "asc"
        }
      });
      return users.map((u) => ({
        usuario_id: u.usuario_id,
        nombre: u.nombre,
        email: u.email,
        rol: u.rol?.nombre_rol ?? "",
        fecha_registro: u.fecha_registro ?? /* @__PURE__ */ new Date(),
        perfil_completo: u.perfil_completo ?? false,
        avatar_url: u.avatar_url,
        nivel_educativo: u.nivel_educativo
      }));
    } catch (error) {
      console.error("Error UserModel.getAllUsers:", error);
      throw new Error("Failed to retrieve users.");
    }
  }
  async createUser(userData) {
    const saltRounds = 10;
    const {
      nombre,
      email,
      contrasena,
      rol_id,
      perfil_completo = false,
      avatar_url = null,
      nivel_educativo = null
    } = userData;
    const fecha_registro = /* @__PURE__ */ new Date();
    try {
      const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
      const newUser = await prisma.usuario.create({
        data: {
          nombre,
          email,
          contrasena: hashedPassword,
          rol_id,
          fecha_registro,
          perfil_completo,
          avatar_url,
          nivel_educativo
        },
        select: {
          usuario_id: true,
          nombre: true,
          email: true,
          fecha_registro: true,
          rol_id: true
        }
      });
      return {
        ...newUser,
        fecha_registro: newUser.fecha_registro ?? fecha_registro
      };
    } catch (error) {
      console.error("Error en UserModel.createUser:", error);
      throw error;
    }
  }
  async updateUser(userId, userData) {
    const dataToUpdate = {};
    Object.keys(userData).forEach((key) => {
      const val = userData[key];
      if (val !== void 0) {
        dataToUpdate[key] = val;
      }
    });
    if (Object.keys(dataToUpdate).length === 0) {
      throw new Error("No data provided for update.");
    }
    try {
      const updatedUser = await prisma.usuario.update({
        where: { usuario_id: userId },
        data: dataToUpdate
      });
      return {
        usuario_id: updatedUser.usuario_id,
        nombre: updatedUser.nombre,
        email: updatedUser.email,
        contrasena: updatedUser.contrasena,
        rol_id: updatedUser.rol_id,
        fecha_registro: updatedUser.fecha_registro ?? /* @__PURE__ */ new Date(),
        perfil_completo: updatedUser.perfil_completo ?? false,
        avatar_url: updatedUser.avatar_url,
        nivel_educativo: updatedUser.nivel_educativo
      };
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error(`User ID ${userId} not found.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error in UserModel.updateUser:", message);
      throw error;
    }
  }
  async getUserById(userId) {
    try {
      const user = await prisma.usuario.findUnique({
        where: { usuario_id: userId },
        include: {
          rol: {
            select: {
              nombre_rol: true
            }
          }
        }
      });
      if (!user) return null;
      return {
        usuario_id: user.usuario_id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol?.nombre_rol ?? "",
        fecha_registro: user.fecha_registro ?? /* @__PURE__ */ new Date(),
        perfil_completo: user.perfil_completo ?? false,
        avatar_url: user.avatar_url,
        nivel_educativo: user.nivel_educativo
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      throw new Error("Failed to retrieve user from the database");
    }
  }
  async deleteUser(userId) {
    try {
      await prisma.usuario.delete({
        where: { usuario_id: userId }
      });
      return true;
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error(`User ID ${userId} not found.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error UserModel.deleteUser (ID: ${userId}):`, message);
      throw new Error("Failed to delete user from the database.");
    }
  }
};
var userModel = new UserModel();

// src/services/auth.service.ts
import bcrypt2 from "bcrypt";
import jwt from "jsonwebtoken";
var AuthService = class {
  async login(email, contrasena) {
    const user = await auth_model_default.getUserByEmail(email);
    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }
    const passwordMatch = await bcrypt2.compare(contrasena, user.contrasena);
    if (!passwordMatch) {
      throw new Error("INVALID_CREDENTIALS");
    }
    const payload = {
      usuario_id: user.usuario_id,
      nombre: user.nombre,
      rol_id: user.rol_id
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    return {
      message: "Inicio de sesi\xF3n exitoso.",
      token,
      userId: user.usuario_id,
      rol: user.rol_id
    };
  }
  async register(userData) {
    const existingUser = await auth_model_default.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error("EMAIL_EXISTS");
    }
    const newUser = await userModel.createUser(userData);
    return {
      message: "Usuario registrado con \xE9xito.",
      usuario: {
        usuario_id: newUser.usuario_id,
        email: newUser.email
      }
    };
  }
};
var authService = new AuthService();

// src/controllers/auth.controller.ts
var AuthController = class {
  async login(req, res) {
    const { email, contrasena } = req.body;
    if (!email || !contrasena) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    try {
      const result = await authService.login(email, contrasena);
      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === "INVALID_CREDENTIALS") {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      console.error("Error during login:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      return res.status(201).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === "EMAIL_EXISTS") {
        return res.status(409).json({ error: "El email ya est\xE1 registrado. Por favor, inicia sesi\xF3n o usa otro correo." });
      }
      console.error("Error al registrar usuario:", error);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
  }
};
var auth_controller_default = new AuthController();

// src/routes/auth.routes.ts
var router = Router();
router.post("/login", auth_controller_default.login);
router.post("/register", auth_controller_default.register);
var auth_routes_default = router;

// src/routes/book.routes.ts
import { Router as Router2 } from "express";

// src/models/book.model.ts
var crearLibro = async (datos) => {
  try {
    return await prisma.libro.create({
      data: {
        titulo: datos.titulo,
        autor: datos.autor,
        genero: datos.genero,
        descripcion: datos.descripcion,
        // Asigna portadaUrl o portada_url al campo correcto en Prisma (portada_url)
        portada_url: datos.portadaUrl || datos.portada_url || null,
        nivel_educativo: datos.nivelEducativo || datos.nivel_educativo || null,
        activo: datos.activo ?? true
      }
    });
  } catch (error) {
    console.error("Error al crear libro:", error);
    throw error;
  }
};
var obtenerTodos = async () => {
  try {
    return await prisma.libro.findMany();
  } catch (error) {
    console.error("Error al obtener todos los libros:", error);
    throw error;
  }
};
var obtenerPorId = async (id) => {
  try {
    return await prisma.libro.findUnique({
      where: { libro_id: id }
    });
  } catch (error) {
    console.error(`Error al obtener libro ${id}:`, error);
    throw error;
  }
};
var buscarLibros = async ({
  query,
  genero,
  nivel_educativo
}) => {
  try {
    const whereClause = {};
    if (query && query.trim() !== "") {
      const cleanQuery = query.trim();
      whereClause.OR = [
        { titulo: { contains: cleanQuery, mode: "insensitive" } },
        { autor: { contains: cleanQuery, mode: "insensitive" } }
      ];
    }
    if (genero) {
      whereClause.genero = genero;
    }
    if (nivel_educativo) {
      whereClause.nivel_educativo = nivel_educativo;
    }
    return await prisma.libro.findMany({
      where: whereClause
    });
  } catch (error) {
    console.error("Error al buscar libros:", error);
    throw error;
  }
};
var actualizarLibro = async (id, datos) => {
  try {
    const portada = datos.portadaUrl !== void 0 ? datos.portadaUrl : datos.portada_url;
    const nivel = datos.nivelEducativo !== void 0 ? datos.nivelEducativo : datos.nivel_educativo;
    return await prisma.libro.update({
      where: { libro_id: id },
      data: {
        ...datos.titulo && { titulo: datos.titulo },
        ...datos.autor && { autor: datos.autor },
        ...datos.genero !== void 0 && { genero: datos.genero },
        ...datos.descripcion !== void 0 && { descripcion: datos.descripcion },
        ...portada !== void 0 && { portada_url: portada },
        ...nivel !== void 0 && { nivel_educativo: nivel },
        ...datos.activo !== void 0 && { activo: datos.activo }
      }
    });
  } catch (error) {
    console.error(`Error al actualizar libro ${id}:`, error);
    throw error;
  }
};
var eliminarLibro = async (id) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.opinion.deleteMany({ where: { libro_id: id } });
      await tx.favorito.deleteMany({ where: { libro_id: id } });
      await tx.lista_libro.deleteMany({ where: { libro_id: id } });
      await tx.recurso_educativo.deleteMany({ where: { libro_id: id } });
      return await tx.libro.delete({
        where: { libro_id: id }
      });
    });
    return !!result;
  } catch (error) {
    console.error("Error al eliminar libro y sus dependencias:", error);
    throw error;
  }
};
var eliminacionLogica = async (id) => {
  try {
    return await prisma.libro.update({
      where: { libro_id: id },
      data: { activo: false }
    });
  } catch (error) {
    console.error(`Error en eliminaci\xF3n l\xF3gica del libro ${id}:`, error);
    throw error;
  }
};

// src/services/book.service.ts
var BookService = class {
  async crearLibro(bookData) {
    return await crearLibro(bookData);
  }
  async obtenerTodos() {
    return await obtenerTodos();
  }
  async obtenerPorId(id) {
    return await obtenerPorId(id);
  }
  async buscarLibros(filters) {
    return await buscarLibros(filters);
  }
  async actualizarLibro(id, bookData) {
    return await actualizarLibro(id, bookData);
  }
  async eliminarLibro(id) {
    return await eliminarLibro(id);
  }
  async eliminacionLogica(id) {
    return await eliminacionLogica(id);
  }
};
var bookService = new BookService();

// src/controllers/book.controller.ts
var BookController = class {
  async crear(req, res) {
    try {
      const nuevoLibro = await bookService.crearLibro(req.body);
      res.status(201).json({
        mensaje: "Libro creado correctamente",
        libro: nuevoLibro
      });
    } catch (error) {
      console.error("Error al crear libro:", error);
      res.status(500).json({ mensaje: "Error al crear libro" });
    }
  }
  async obtenerCatalogo(req, res) {
    try {
      const libros = await bookService.obtenerTodos();
      res.json(libros);
    } catch (error) {
      console.error("Error al obtener cat\xE1logo:", error);
      res.status(500).json({ mensaje: "Error al obtener libros" });
    }
  }
  async verDetalle(req, res) {
    const id = parseInt(String(req.params.id), 10);
    try {
      const libro = await bookService.obtenerPorId(id);
      if (!libro) {
        return res.status(404).json({ mensaje: "Libro no encontrado" });
      }
      res.json(libro);
    } catch (error) {
      console.error("Error al obtener detalle:", error);
      res.status(500).json({ mensaje: "Error al obtener detalle del libro" });
    }
  }
  async buscar(req, res) {
    try {
      const libros = await bookService.buscarLibros(
        req.query
      );
      res.json(libros);
    } catch (error) {
      console.error("Error al buscar libros:", error);
      res.status(500).json({ mensaje: "Error al buscar libros" });
    }
  }
  async actualizar(req, res) {
    const id = parseInt(String(req.params.id), 10);
    try {
      await bookService.actualizarLibro(id, req.body);
      res.json({ mensaje: "Libro actualizado correctamente" });
    } catch (error) {
      console.error("Error al actualizar:", error);
      res.status(500).json({ mensaje: "Error al actualizar libro" });
    }
  }
  async eliminar(req, res) {
    const id = parseInt(String(req.params.id), 10);
    try {
      const eliminado = await bookService.eliminarLibro(id);
      if (!eliminado) {
        return res.status(404).json({ mensaje: "Libro no encontrado para eliminar" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error al eliminar:", error);
      res.status(500).json({ mensaje: "Error al eliminar libro y sus dependencias" });
    }
  }
  async eliminacionLogica(req, res) {
    const id = parseInt(String(req.params.id), 10);
    try {
      await bookService.eliminacionLogica(id);
      res.json({ mensaje: "Libro marcado como inactivo" });
    } catch (error) {
      console.error("Error al marcar como inactivo:", error);
      res.status(500).json({ mensaje: "Error al marcar libro como inactivo" });
    }
  }
};
var book_controller_default = new BookController();

// src/routes/book.routes.ts
var router2 = Router2();
router2.post("/", book_controller_default.crear);
router2.get("/", book_controller_default.obtenerCatalogo);
router2.get("/buscar", book_controller_default.buscar);
router2.get("/:id", book_controller_default.verDetalle);
router2.put("/:id", book_controller_default.actualizar);
router2.delete("/:id", book_controller_default.eliminar);
router2.patch("/inactivar/:id", book_controller_default.eliminacionLogica);
var book_routes_default = router2;

// src/routes/cafe.routes.ts
import { Router as Router3 } from "express";

// src/models/cafe.model.ts
var crearCafeDB = async (datos) => {
  const { titulo, descripcion, libro_id, docente_id, fecha_evento, lugar } = datos;
  return await prisma.$transaction(async (tx) => {
    const cafe = await tx.cafe_literario.create({
      data: {
        titulo,
        descripcion,
        libro_id,
        docente_id,
        fecha_evento,
        lugar: lugar ?? null
      },
      select: {
        cafe_id: true
      }
    });
    const foroTitulo = `Foro de Debate: ${titulo}`;
    const foroDesc = "Espacio de discusi\xF3n y opiniones para el Caf\xE9 Literario sobre la lectura propuesta.";
    const foro = await tx.foro.create({
      data: {
        titulo: foroTitulo,
        descripcion: foroDesc,
        creador_id: docente_id,
        cafe_id: cafe.cafe_id
      },
      select: {
        foro_id: true
      }
    });
    return { cafe_id: cafe.cafe_id, foro_id: foro.foro_id };
  });
};
var obtenerCafesDB = async (usuario_id = null) => {
  const cafes = await prisma.cafe_literario.findMany({
    include: {
      libro: {
        select: {
          libro_id: true,
          titulo: true,
          autor: true,
          portada_url: true
        }
      },
      usuario: {
        select: {
          usuario_id: true,
          nombre: true,
          avatar_url: true
        }
      },
      foro: {
        select: {
          foro_id: true
        }
      },
      asistencia_cafe: {
        select: {
          usuario_id: true,
          estado: true
        }
      },
      voto_cafe: {
        select: {
          usuario_id: true,
          voto: true
        }
      }
    },
    orderBy: {
      fecha_evento: "desc"
    }
  });
  return cafes.map((c) => formatCafeDetalle(c, usuario_id));
};
var obtenerCafePorIdDB = async (cafe_id) => {
  const cafe = await prisma.cafe_literario.findUnique({
    where: { cafe_id },
    include: {
      libro: {
        select: {
          libro_id: true,
          titulo: true,
          autor: true,
          genero: true,
          descripcion: true,
          portada_url: true
        }
      },
      usuario: {
        select: {
          usuario_id: true,
          nombre: true,
          avatar_url: true
        }
      },
      foro: {
        select: {
          foro_id: true
        }
      },
      asistencia_cafe: {
        select: {
          usuario_id: true,
          estado: true
        }
      },
      voto_cafe: {
        select: {
          usuario_id: true,
          voto: true
        }
      }
    }
  });
  if (!cafe) return null;
  return formatCafeDetalle(cafe, null);
};
var actualizarCafeDB = async (cafe_id, datos) => {
  const { titulo, descripcion, libro_id, fecha_evento, lugar, estado } = datos;
  const data = {};
  if (titulo !== void 0 && titulo !== null) data.titulo = titulo;
  if (descripcion !== void 0 && descripcion !== null) data.descripcion = descripcion;
  if (libro_id !== void 0 && libro_id !== null) data.libro_id = libro_id;
  if (fecha_evento !== void 0 && fecha_evento !== null) data.fecha_evento = fecha_evento;
  if (lugar !== void 0 && lugar !== null) data.lugar = lugar;
  if (estado !== void 0 && estado !== null) data.estado = estado;
  try {
    return await prisma.cafe_literario.update({
      where: { cafe_id },
      data,
      select: {
        cafe_id: true
      }
    });
  } catch (error) {
    return null;
  }
};
var eliminarCafeDB = async (cafe_id) => {
  try {
    return await prisma.cafe_literario.delete({
      where: { cafe_id },
      select: {
        cafe_id: true
      }
    });
  } catch (error) {
    return null;
  }
};
var registrarAsistenciaDB = async (cafe_id, usuario_id, estado = "confirmado") => {
  return await prisma.asistencia_cafe.upsert({
    where: {
      cafe_id_usuario_id: { cafe_id, usuario_id }
    },
    create: {
      cafe_id,
      usuario_id,
      estado
    },
    update: {
      estado,
      fecha_registro: /* @__PURE__ */ new Date()
    }
  });
};
var eliminarAsistenciaDB = async (cafe_id, usuario_id) => {
  return await prisma.asistencia_cafe.deleteMany({
    where: { cafe_id, usuario_id }
  });
};
var obtenerAsistenciaUsuarioDB = async (cafe_id, usuario_id) => {
  return await prisma.asistencia_cafe.findFirst({
    where: { cafe_id, usuario_id }
  });
};
var obtenerAsistentesCafeDB = async (cafe_id) => {
  return await prisma.asistencia_cafe.findMany({
    where: { cafe_id },
    include: {
      usuario: {
        select: {
          usuario_id: true,
          nombre: true,
          email: true,
          avatar_url: true
        }
      }
    },
    orderBy: {
      fecha_registro: "desc"
    }
  });
};
var registrarVotoDB = async (cafe_id, usuario_id, voto) => {
  return await prisma.voto_cafe.upsert({
    where: {
      cafe_id_usuario_id: { cafe_id, usuario_id }
    },
    create: {
      cafe_id,
      usuario_id,
      voto
    },
    update: {
      voto,
      fecha_voto: /* @__PURE__ */ new Date()
    }
  });
};
var obtenerVotoUsuarioDB = async (cafe_id, usuario_id) => {
  return await prisma.voto_cafe.findFirst({
    where: { cafe_id, usuario_id }
  });
};
var formatCafeDetalle = (c, usuario_id) => {
  const asistencias = c.asistencia_cafe;
  const votos = c.voto_cafe;
  const total_asistentes = asistencias.filter(
    (a) => a.estado === "confirmado" || a.estado === "asistio"
  ).length;
  const votos_positivos = votos.filter((v) => v.voto === true).length;
  const votos_negativos = votos.filter((v) => v.voto === false).length;
  const asistencia_usuario = usuario_id !== null ? asistencias.find((a) => a.usuario_id === usuario_id)?.estado ?? null : null;
  const voto_usuario = usuario_id !== null ? votos.find((v) => v.usuario_id === usuario_id)?.voto ?? null : null;
  return {
    cafe_id: c.cafe_id,
    titulo: c.titulo,
    descripcion: c.descripcion,
    fecha_evento: c.fecha_evento,
    lugar: c.lugar,
    estado: c.estado,
    fecha_creacion: c.fecha_creacion,
    libro_id: c.libro?.libro_id ?? null,
    libro_titulo: c.libro?.titulo ?? null,
    libro_autor: c.libro?.autor ?? null,
    libro_genero: c.libro?.genero ?? null,
    libro_descripcion: c.libro?.descripcion ?? null,
    libro_portada: c.libro?.portada_url ?? null,
    docente_id: c.usuario?.usuario_id ?? null,
    docente_nombre: c.usuario?.nombre ?? null,
    docente_avatar: c.usuario?.avatar_url ?? null,
    foro_id: c.foro[0]?.foro_id ?? null,
    total_asistentes,
    votos_positivos,
    votos_negativos,
    total_votos: votos.length,
    asistencia_usuario,
    voto_usuario
  };
};

// src/controllers/cafe.controller.ts
var crearCafe = async (req, res) => {
  try {
    const { titulo, descripcion, libro_id, docente_id, fecha_evento, lugar } = req.body;
    if (!titulo || !fecha_evento) {
      return res.status(400).json({ mensaje: "El t\xEDtulo y la fecha del evento son obligatorios" });
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
      mensaje: "Caf\xE9 Literario creado correctamente",
      cafe: nuevoCafe
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\u274C Error al crear Caf\xE9 Literario:", error);
    res.status(500).json({ mensaje: "Error interno al crear Caf\xE9 Literario", detalle: message });
  }
};
var obtenerCafes = async (req, res) => {
  try {
    const { usuario_id } = req.query;
    const cafes = await obtenerCafesDB(usuario_id ? parseInt(String(usuario_id)) : null);
    res.json(cafes);
  } catch (error) {
    console.error("\u274C Error al obtener Caf\xE9s Literarios:", error);
    res.status(500).json({ mensaje: "Error interno al obtener los Caf\xE9s Literarios" });
  }
};
var obtenerCafe = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id } = req.query;
    const cafe = await obtenerCafePorIdDB(parseInt(String(id)));
    if (!cafe) {
      return res.status(404).json({ mensaje: "Caf\xE9 Literario no encontrado" });
    }
    let asistencia_usuario = null;
    let voto_usuario = null;
    if (usuario_id) {
      const asistencia = await obtenerAsistenciaUsuarioDB(parseInt(String(id)), parseInt(String(usuario_id)));
      const voto = await obtenerVotoUsuarioDB(parseInt(String(id)), parseInt(String(usuario_id)));
      asistencia_usuario = asistencia ? asistencia.estado : null;
      voto_usuario = voto ? voto.voto : null;
    }
    res.json({
      ...cafe,
      asistencia_usuario,
      voto_usuario
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\u274C Error al obtener Caf\xE9 Literario:", error);
    res.status(500).json({ mensaje: "Error al obtener el Caf\xE9 Literario", detalle: message });
  }
};
var actualizarCafe = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, libro_id, fecha_evento, lugar, estado } = req.body;
    const cafeActualizado = await actualizarCafeDB(parseInt(String(id)), {
      titulo,
      descripcion,
      libro_id,
      fecha_evento,
      lugar,
      estado
    });
    if (!cafeActualizado) {
      return res.status(404).json({ mensaje: "Caf\xE9 Literario no encontrado" });
    }
    res.json({ mensaje: "Caf\xE9 Literario actualizado correctamente", cafe: cafeActualizado });
  } catch (error) {
    console.error("\u274C Error al actualizar Caf\xE9 Literario:", error);
    res.status(500).json({ mensaje: "Error al actualizar Caf\xE9 Literario" });
  }
};
var eliminarCafe = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await eliminarCafeDB(parseInt(String(id)));
    if (!eliminado) {
      return res.status(404).json({ mensaje: "Caf\xE9 Literario no encontrado" });
    }
    res.json({ mensaje: "Caf\xE9 Literario eliminado correctamente" });
  } catch (error) {
    console.error("\u274C Error al eliminar Caf\xE9 Literario:", error);
    res.status(500).json({ mensaje: "Error al eliminar Caf\xE9 Literario" });
  }
};
var toggleAsistencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id, estado = "confirmado" } = req.body;
    if (!usuario_id) {
      return res.status(400).json({ mensaje: "Se requiere usuario_id" });
    }
    const asistenciaExistente = await obtenerAsistenciaUsuarioDB(parseInt(String(id)), parseInt(String(usuario_id)));
    if (asistenciaExistente && asistenciaExistente.estado === estado) {
      await eliminarAsistenciaDB(parseInt(String(id)), parseInt(String(usuario_id)));
      return res.json({ mensaje: "Asistencia cancelada", estado: null });
    }
    const nuevaAsistencia = await registrarAsistenciaDB(
      parseInt(String(id)),
      parseInt(String(usuario_id)),
      estado
    );
    res.json({ mensaje: "Asistencia registrada correctamente", asistencia: nuevaAsistencia });
  } catch (error) {
    console.error("\u274C Error al gestionar asistencia:", error);
    res.status(500).json({ mensaje: "Error al gestionar la asistencia" });
  }
};
var obtenerAsistentes = async (req, res) => {
  try {
    const { id } = req.params;
    const asistentes = await obtenerAsistentesCafeDB(parseInt(String(id)));
    res.json(asistentes);
  } catch (error) {
    console.error("\u274C Error al obtener asistentes:", error);
    res.status(500).json({ mensaje: "Error al obtener la lista de asistentes" });
  }
};
var votarCafe = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_id, voto } = req.body;
    if (!usuario_id || typeof voto !== "boolean") {
      return res.status(400).json({ mensaje: "usuario_id y voto (boolean true/false) son obligatorios" });
    }
    const votoRegistrado = await registrarVotoDB(
      parseInt(String(id)),
      parseInt(String(usuario_id)),
      voto
    );
    res.json({ mensaje: "Voto registrado con \xE9xito", voto: votoRegistrado });
  } catch (error) {
    console.error("\u274C Error al registrar voto:", error);
    res.status(500).json({ mensaje: "Error al registrar la votaci\xF3n" });
  }
};

// src/routes/cafe.routes.ts
var router3 = Router3();
router3.post("/", crearCafe);
router3.get("/", obtenerCafes);
router3.get("/:id", obtenerCafe);
router3.put("/:id", actualizarCafe);
router3.delete("/:id", eliminarCafe);
router3.post("/:id/asistencia", toggleAsistencia);
router3.get("/:id/asistentes", obtenerAsistentes);
router3.post("/:id/voto", votarCafe);
var cafe_routes_default = router3;

// src/routes/comment.routes.ts
import { Router as Router4 } from "express";

// src/models/comment.model.ts
var insertarComentario = async (foro_id, usuario_id, contenido) => {
  try {
    const nuevoComentario = await prisma.comentario_foro.create({
      data: {
        foro_id,
        usuario_id,
        contenido
      },
      select: {
        comentario_id: true
      }
    });
    return nuevoComentario;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error OpinionModel.createOpinion:", message);
    throw error;
  }
};
var obtenerComentariosPorForo = async (foro_id) => {
  const comentarios = await prisma.comentario_foro.findMany({
    where: { foro_id },
    include: {
      usuario: {
        select: {
          usuario_id: true,
          nombre: true,
          email: true
        }
      }
    },
    orderBy: {
      fecha: "asc"
    }
  });
  return comentarios.map((item) => ({
    comentario_id: item.comentario_id,
    foro_id: item.foro_id,
    usuario_id: item.usuario_id,
    contenido: item.contenido,
    fecha: item.fecha ?? /* @__PURE__ */ new Date(),
    nombre: item.usuario?.nombre ?? "",
    email: item.usuario?.email ?? ""
  }));
};
var obtenerTodosComentarios = async () => {
  const result = await prisma.comentario_foro.findMany({
    orderBy: {
      fecha: "asc"
    }
  });
  return result.map((item) => ({
    ...item,
    fecha: item.fecha ?? /* @__PURE__ */ new Date()
  }));
};
var obtenerComentarioPorId = async (comentario_id) => {
  const result = await prisma.comentario_foro.findUnique({
    where: { comentario_id }
  });
  if (!result) return void 0;
  return {
    ...result,
    fecha: result.fecha ?? /* @__PURE__ */ new Date()
  };
};
var actualizarComentarioPorId = async (comentario_id, contenido) => {
  const result = await prisma.comentario_foro.update({
    where: { comentario_id },
    data: { contenido },
    select: {
      comentario_id: true
    }
  });
  return result;
};
var eliminarComentarioPorId = async (comentario_id) => {
  const result = await prisma.comentario_foro.delete({
    where: { comentario_id },
    select: {
      comentario_id: true
    }
  });
  return result;
};

// src/models/medal.model.ts
var MedalModel = class {
  async verificarYAsignarMedallas(usuario_id) {
    try {
      const cantidadOpiniones = await prisma.opinion.count({
        where: { usuario_id }
      });
      console.log("cantidadOpiniones", cantidadOpiniones);
      if (cantidadOpiniones >= 1) {
        await this.asignarMedallaSiNoTiene(usuario_id, 6);
      }
      if (cantidadOpiniones >= 10) {
        await this.asignarMedallaSiNoTiene(usuario_id, 1);
      }
      const cantidadForos = await prisma.comentario_foro.count({
        where: { usuario_id }
      });
      if (cantidadForos >= 1) {
        await this.asignarMedallaSiNoTiene(usuario_id, 5);
      }
      if (cantidadForos >= 10) {
        await this.asignarMedallaSiNoTiene(usuario_id, 2);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error al verificar o asignar medallas:", message);
    }
  }
  async asignarMedallaSiNoTiene(usuario_id, medalla_id) {
    try {
      const yaTiene = await prisma.usuario_medalla.findUnique({
        where: {
          usuario_id_medalla_id: {
            usuario_id,
            medalla_id
          }
        }
      });
      console.log("yaTiene", yaTiene, usuario_id, medalla_id);
      if (!yaTiene) {
        await prisma.usuario_medalla.create({
          data: {
            usuario_id,
            medalla_id
          }
        });
        console.log(`\u2705 Medalla id ${medalla_id} asignada al usuario ${usuario_id}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error al asignar medalla ${medalla_id} al usuario ${usuario_id}:`, message);
    }
  }
  // Obtener todas las medallas de un usuario
  async obtenerMedallasPorUsuario(usuario_id) {
    try {
      const usuarioMedallas = await prisma.usuario_medalla.findMany({
        where: { usuario_id },
        include: {
          medalla: true
        }
      });
      return usuarioMedallas.map((um) => ({
        medalla_id: um.medalla.medalla_id,
        nombre: um.medalla.nombre,
        descripcion: um.medalla.descripcion ?? "",
        tipo_accion: um.medalla.tipo_accion ?? ""
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error al obtener medallas del usuario:", message);
      throw error;
    }
  }
};
var medalModel = new MedalModel();

// src/models/foro.model.ts
import { TipoActividad } from "@prisma/client";
var crearForoDB = async (titulo, descripcion, creador_id, esApl = false, episodioId) => {
  const result = await prisma.foro.create({
    data: {
      titulo,
      descripcion: descripcion ?? "",
      creador_id: creador_id ? Number(creador_id) : 0,
      es_apl: esApl,
      episodio_id: episodioId ? Number(episodioId) : null
    },
    select: {
      foro_id: true
    }
  });
  try {
    await prisma.actividad_feed.create({
      data: {
        usuario_id: creador_id ? Number(creador_id) : null,
        tipo: esApl ? TipoActividad.FORO_APL : TipoActividad.AVISO,
        titulo: `${esApl ? "Nuevo debate APL" : "Nuevo foro"}: ${titulo}`,
        descripcion,
        entidad_id: result.foro_id
      }
    });
  } catch (error) {
    console.error("\u26A0\uFE0F No se pudo registrar la actividad en el feed:", error);
  }
  return result;
};
var obtenerTodosForosDB = async () => {
  const foros = await prisma.foro.findMany({
    include: {
      usuario: {
        select: {
          nombre: true
        }
      }
    },
    orderBy: {
      fecha_creacion: "desc"
    }
  });
  return foros.map((f) => ({
    foro_id: f.foro_id,
    titulo: f.titulo,
    descripcion: f.descripcion ?? "",
    creador_id: f.creador_id,
    fecha_creacion: f.fecha_creacion ?? /* @__PURE__ */ new Date(),
    creador_nombre: f.usuario?.nombre ?? null,
    es_apl: f.es_apl ?? false,
    episodio_id: f.episodio_id
  }));
};
var obtenerForoPorIdDB = async (foro_id) => {
  const f = await prisma.foro.findUnique({
    where: { foro_id },
    include: {
      usuario: {
        select: {
          nombre: true
        }
      }
    }
  });
  if (!f) return null;
  return {
    foro_id: f.foro_id,
    titulo: f.titulo,
    descripcion: f.descripcion ?? "",
    creador_id: f.creador_id,
    fecha_creacion: f.fecha_creacion ?? /* @__PURE__ */ new Date(),
    creador_nombre: f.usuario?.nombre ?? null,
    es_apl: f.es_apl ?? false,
    episodio_id: f.episodio_id
  };
};
var actualizarForoDB = async (foro_id, titulo, descripcion) => {
  const result = await prisma.foro.update({
    where: { foro_id },
    data: {
      ...titulo !== void 0 && { titulo },
      ...descripcion !== void 0 && { descripcion }
    },
    select: {
      foro_id: true
    }
  });
  return result;
};
var eliminarForoDB = async (foro_id) => {
  try {
    const result = await prisma.foro.delete({
      where: { foro_id },
      select: {
        foro_id: true
      }
    });
    return result;
  } catch (error) {
    return null;
  }
};
var obtenerForoConComentariosDB = async (foro_id) => {
  const foro = await prisma.foro.findUnique({
    where: { foro_id },
    include: {
      usuario: {
        select: {
          nombre: true,
          avatar_url: true
        }
      },
      comentario_foro: {
        include: {
          usuario: {
            select: {
              nombre: true,
              avatar_url: true
            }
          }
        },
        orderBy: {
          fecha: "asc"
        }
      }
    }
  });
  if (!foro) return null;
  const comentariosFormatted = foro.comentario_foro.map((c) => ({
    comentario_id: c.comentario_id,
    contenido: c.contenido,
    fecha: c.fecha ?? /* @__PURE__ */ new Date(),
    usuario_nombre: c.usuario?.nombre ?? "",
    usuario_avatar: c.usuario?.avatar_url ?? null
  }));
  return {
    foro_id: foro.foro_id,
    titulo: foro.titulo,
    descripcion: foro.descripcion ?? "",
    fecha_creacion: foro.fecha_creacion ?? /* @__PURE__ */ new Date(),
    creador_nombre: foro.usuario?.nombre ?? null,
    creador_avatar: foro.usuario?.avatar_url ?? null,
    es_apl: foro.es_apl ?? false,
    episodio_id: foro.episodio_id,
    comentarios: comentariosFormatted
  };
};

// src/services/comment.service.ts
var CommentService = class {
  async crearComentario(foroId, usuarioId, contenido) {
    const nuevoComentario = await insertarComentario(foroId, usuarioId, contenido);
    await medalModel.verificarYAsignarMedallas(usuarioId);
    const foroConComentarios = await obtenerForoConComentariosDB(foroId);
    const comentarioCompleto = foroConComentarios?.comentarios.find(
      (c) => c.comentario_id === nuevoComentario.comentario_id
    );
    return comentarioCompleto;
  }
  async obtenerComentarios(foroId) {
    if (foroId) {
      return await obtenerComentariosPorForo(foroId);
    }
    return await obtenerTodosComentarios();
  }
  async obtenerComentarioPorId(id) {
    return await obtenerComentarioPorId(id);
  }
  async actualizarComentario(id, contenido) {
    return await actualizarComentarioPorId(id, contenido);
  }
  async eliminarComentario(id) {
    return await eliminarComentarioPorId(id);
  }
};
var commentService = new CommentService();

// src/controllers/comment.controller.ts
var crearComentario = async (req, res) => {
  try {
    const foro_id = parseInt(String(req.params.id), 10);
    const { usuario_id, contenido } = req.body;
    const comentarioCompleto = await commentService.crearComentario(foro_id, usuario_id, contenido);
    res.status(201).json(comentarioCompleto);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\u274C Error al crear comentario:", error);
    res.status(500).json({
      mensaje: "Error al crear el comentario",
      detalle: message
    });
  }
};
var obtenerComentarios = async (req, res) => {
  try {
    const foroId = req.params.foro_id ? parseInt(String(req.params.foro_id), 10) : void 0;
    const comentarios = await commentService.obtenerComentarios(foroId);
    res.json(comentarios);
  } catch (error) {
    console.error("\u274C Error al obtener comentarios:", error);
    res.status(500).json({ mensaje: "Error al obtener los comentarios" });
  }
};
var obtenerComentario = async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const comentario = await commentService.obtenerComentarioPorId(id);
    if (!comentario) return res.status(404).json({ mensaje: "Comentario no encontrado" });
    res.json(comentario);
  } catch (error) {
    console.error("\u274C Error al obtener comentario:", error);
    res.status(500).json({ mensaje: "Error al obtener el comentario" });
  }
};
var actualizarComentario = async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const comentarioActualizado = await commentService.actualizarComentario(id, req.body.contenido);
    if (!comentarioActualizado) return res.status(404).json({ mensaje: "Comentario no encontrado" });
    res.json({ mensaje: "Comentario actualizado correctamente" });
  } catch (error) {
    console.error("\u274C Error al actualizar comentario:", error);
    res.status(500).json({ mensaje: "Error al actualizar el comentario" });
  }
};
var eliminarComentario = async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const comentarioEliminado = await commentService.eliminarComentario(id);
    if (!comentarioEliminado) return res.status(404).json({ mensaje: "Comentario no encontrado" });
    res.json({ mensaje: "Comentario eliminado correctamente" });
  } catch (error) {
    console.error("\u274C Error al eliminar comentario:", error);
    res.status(500).json({ mensaje: "Error al eliminar el comentario" });
  }
};

// src/routes/comment.routes.ts
var router4 = Router4();
router4.post("/", crearComentario);
router4.get("/:foro_id", obtenerComentarios);
router4.get("/:id", obtenerComentario);
router4.put("/:id", actualizarComentario);
router4.delete("/:id", eliminarComentario);
router4.post("/:id/comentarios", crearComentario);
var comment_routes_default = router4;

// src/routes/favorite.routes.ts
import { Router as Router5 } from "express";

// src/models/favorite.model.ts
var favoriteModel = {
  async createFavorite({ usuario_id, libro_id }) {
    const nuevoFavorito = await prisma.favorito.create({
      data: {
        usuario_id,
        libro_id
      }
    });
    return {
      usuario_id: nuevoFavorito.usuario_id,
      libro_id: nuevoFavorito.libro_id
    };
  },
  async getAllFavorites() {
    const favoritos = await prisma.favorito.findMany();
    return favoritos.map((f) => ({
      usuario_id: f.usuario_id,
      libro_id: f.libro_id
    }));
  },
  async getFavoritesByUser(usuario_id) {
    const favoritos = await prisma.favorito.findMany({
      where: { usuario_id },
      include: {
        libro: true
      }
    });
    return favoritos.map((f) => ({
      libro_id: f.libro.libro_id,
      titulo: f.libro.titulo,
      autor: f.libro.autor,
      genero: f.libro.genero ?? "",
      descripcion: f.libro.descripcion ?? "",
      portada_url: f.libro.portada_url ?? "",
      calificacion_promedio: Number(f.libro.calificacion_promedio ?? 0),
      estado_lectura: f.estado_lectura
    }));
  },
  async getReadingStatusesByUser(usuario_id) {
    const favoritos = await prisma.favorito.findMany({
      where: { usuario_id },
      select: {
        libro_id: true,
        estado_lectura: true
      }
    });
    return favoritos.map((favorito) => ({
      libro_id: favorito.libro_id,
      estado_lectura: favorito.estado_lectura
    }));
  },
  async updateReadingStatus(usuario_id, libro_id, estado_lectura) {
    const favorito = await prisma.favorito.updateMany({
      where: { usuario_id, libro_id },
      data: { estado_lectura }
    });
    if (favorito.count === 0) return null;
    return { libro_id, estado_lectura };
  },
  async deleteFavorite(usuario_id, libro_id) {
    try {
      const result = await prisma.favorito.deleteMany({
        where: {
          usuario_id,
          libro_id
        }
      });
      return result.count > 0;
    } catch (error) {
      console.error("Error al eliminar favorito:", error);
      return false;
    }
  }
};

// src/services/favorite.service.ts
var FavoriteService = class {
  async getAllFavorites() {
    return await favoriteModel.getAllFavorites();
  }
  async createFavorite(data) {
    return await favoriteModel.createFavorite(data);
  }
  async getFavoritesByUser(usuarioId) {
    return await favoriteModel.getFavoritesByUser(usuarioId);
  }
  async getReadingStatusesByUser(usuarioId) {
    return await favoriteModel.getReadingStatusesByUser(usuarioId);
  }
  async updateReadingStatus(usuarioId, libroId, estadoLectura) {
    return await favoriteModel.updateReadingStatus(usuarioId, libroId, estadoLectura);
  }
  async deleteFavorite(usuarioId, libroId) {
    return await favoriteModel.deleteFavorite(usuarioId, libroId);
  }
};
var favoriteService = new FavoriteService();

// src/controllers/favorite.controller.ts
var READING_STATUSES = ["general", "quiero-leer", "leyendo", "leido"];
var FavoriteController = class {
  // GET: Obtener todos los favoritos (opcional, para testing o admin)
  async getAll(req, res) {
    try {
      const favorites = await favoriteService.getAllFavorites();
      res.status(200).json(favorites);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting favorites:", message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  // POST: Crear un nuevo favorito
  async create(req, res) {
    try {
      const usuario_id = req.userId;
      const { libro_id } = req.body;
      if (!usuario_id || !libro_id) {
        return res.status(400).json({ error: "Missing required fields: usuario_id or libro_id" });
      }
      const newFavorite = await favoriteService.createFavorite({ usuario_id, libro_id });
      res.status(201).json({
        message: "Favorite created successfully",
        favorite: newFavorite
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error creating favorite:", message);
      if (message.includes("duplicate key")) {
        return res.status(409).json({ error: "This book is already in your favorites" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
  // GET: Obtener favoritos del usuario autenticado
  async getByUser(req, res) {
    try {
      const usuario_id = req.userId;
      if (!usuario_id) {
        return res.status(400).json({ error: "User ID missing in token" });
      }
      const favorites = await favoriteService.getFavoritesByUser(usuario_id);
      res.status(200).json(favorites);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting user favorites:", message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  async getReadingStatuses(req, res) {
    try {
      const usuario_id = req.userId;
      if (!usuario_id) {
        return res.status(400).json({ error: "User ID missing in token" });
      }
      const statuses = await favoriteService.getReadingStatusesByUser(usuario_id);
      return res.status(200).json(statuses);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting reading statuses:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async updateReadingStatus(req, res) {
    try {
      const usuario_id = req.userId;
      const libro_id = Number(req.body.libro_id);
      const estado_lectura = req.body.estado_lectura;
      if (!usuario_id || !Number.isInteger(libro_id) || !READING_STATUSES.includes(estado_lectura)) {
        return res.status(400).json({ error: "Invalid book ID or reading status" });
      }
      const updated = await favoriteService.updateReadingStatus(usuario_id, libro_id, estado_lectura);
      if (!updated) {
        return res.status(404).json({ error: "Favorite not found" });
      }
      return res.status(200).json(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error updating reading status:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  // DELETE: Eliminar un favorito
  async delete(req, res) {
    try {
      const usuario_id = req.userId;
      const libro_id = parseInt(String(req.body.libro_id), 10);
      if (!usuario_id || isNaN(libro_id)) {
        return res.status(400).json({ error: "Invalid or missing IDs" });
      }
      const result = await favoriteService.deleteFavorite(usuario_id, libro_id);
      if (!result) {
        return res.status(404).json({ error: "Favorite not found" });
      }
      return res.status(204).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error deleting favorite:", message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};
var favorite_controller_default = new FavoriteController();

// src/middleware/auth.middleware.ts
import jwt2 from "jsonwebtoken";
var verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt2.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.usuario_id ?? decoded.id;
    req.userRole = decoded.rol_id ?? 1;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
var requireRole = (requiredRole) => {
  return (req, res, next) => {
    const userRoleNumber = Number(req.userRole);
    if (!userRoleNumber || userRoleNumber !== requiredRole) {
      return res.status(403).json({ error: "Acceso denegado. Permisos insuficientes." });
    }
    next();
  };
};

// src/routes/favorite.routes.ts
var router5 = Router5();
router5.post("/", verifyToken, favorite_controller_default.create);
router5.get("/", verifyToken, favorite_controller_default.getByUser);
router5.get("/statuses", verifyToken, favorite_controller_default.getReadingStatuses);
router5.patch("/status", verifyToken, favorite_controller_default.updateReadingStatus);
router5.delete("/", verifyToken, favorite_controller_default.delete);
router5.get("/all", verifyToken, favorite_controller_default.getAll);
var favorite_routes_default = router5;

// src/routes/feed.routes.ts
import { Router as Router6 } from "express";

// src/models/feed.model.ts
var obtenerActividadesFeedDB = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [actividades, total] = await Promise.all([
    prisma.actividad_feed.findMany({
      take: limit,
      skip,
      orderBy: {
        fecha: "desc"
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            avatar_url: true
          }
        }
      }
    }),
    prisma.actividad_feed.count()
  ]);
  const actividadesFormateadas = actividades.map((a) => ({
    actividad_id: a.actividad_id,
    usuario_id: a.usuario_id,
    tipo: a.tipo,
    titulo: a.titulo,
    descripcion: a.descripcion,
    entidad_id: a.entidad_id,
    fecha: a.fecha,
    usuario_nombre: a.usuario?.nombre ?? null,
    usuario_avatar: a.usuario?.avatar_url ?? null
  }));
  return { actividades: actividadesFormateadas, total };
};

// src/services/feed.service.ts
var FeedService = class {
  async obtenerFeed(page, limit) {
    const pageNum = page && page > 0 ? page : 1;
    const limitNum = limit && limit > 0 ? limit : 20;
    return await obtenerActividadesFeedDB(pageNum, limitNum);
  }
};
var feedService = new FeedService();

// src/controllers/feed.controller.ts
var obtenerFeed = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    const resultado = await feedService.obtenerFeed(page, limit);
    res.status(200).json({
      total: resultado.total,
      pagina: page,
      limite: limit,
      actividades: resultado.actividades
    });
  } catch (error) {
    console.error("Error al obtener el feed de actividades:", error);
    res.status(500).json({ error: "Error interno al consultar el feed de actividades." });
  }
};
var limpiarFeed = async (_req, res) => {
  try {
    await prisma.actividad_feed.deleteMany({});
    res.status(200).json({ message: "Muro de actividades limpiado correctamente." });
  } catch (error) {
    console.error("Error al limpiar el feed de actividades:", error);
    res.status(500).json({ error: "Error interno al vaciar el muro de actividades." });
  }
};

// src/routes/feed.routes.ts
var router6 = Router6();
router6.get("/", verifyToken, obtenerFeed);
router6.delete("/", verifyToken, limpiarFeed);
var feed_routes_default = router6;

// src/routes/forum.routes.ts
import { Router as Router7 } from "express";

// src/services/forum.service.ts
var ForumService = class {
  async crearForo(titulo, descripcion, creadorId, esApl = false, episodioId) {
    return await crearForoDB(titulo, descripcion, creadorId, esApl, episodioId);
  }
  async obtenerTodosForos() {
    return await obtenerTodosForosDB();
  }
  async obtenerForoPorId(id) {
    return await obtenerForoPorIdDB(id);
  }
  async actualizarForo(id, titulo, descripcion) {
    return await actualizarForoDB(id, titulo, descripcion);
  }
  async eliminarForo(id) {
    return await eliminarForoDB(id);
  }
  async obtenerForoConComentarios(id) {
    return await obtenerForoConComentariosDB(id);
  }
};
var forumService = new ForumService();

// src/controllers/forum.controller.ts
var crearForo = async (req, res) => {
  try {
    console.log("\u{1F7E1} Datos recibidos desde frontend:", req.body);
    const { titulo, descripcion, creador_id, es_apl, episodio_id } = req.body;
    const nuevoForo = await forumService.crearForo(
      titulo,
      descripcion,
      creador_id,
      Boolean(es_apl),
      episodio_id ? parseInt(String(episodio_id), 10) : void 0
    );
    res.status(201).json({ foro_id: nuevoForo.foro_id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\u274C Error al crear foro:", error);
    res.status(500).json({ mensaje: "Error al crear el foro", detalle: message });
  }
};
var obtenerForos = async (req, res) => {
  try {
    const foros = await forumService.obtenerTodosForos();
    res.json(foros);
  } catch (error) {
    console.error("\u274C Error al obtener foros:", error);
    res.status(500).json({ mensaje: "Error al obtener los foros" });
  }
};
var obtenerForo = async (req, res) => {
  try {
    const foro_id = parseInt(String(req.params.id), 10);
    const foro = await forumService.obtenerForoPorId(foro_id);
    if (!foro) {
      return res.status(404).json({ mensaje: "Foro no encontrado" });
    }
    res.json(foro);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\u274C ERROR REAL:", error);
    res.status(500).json({
      mensaje: "Error al obtener el foro",
      detalle: message
    });
  }
};
var actualizarForo = async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { titulo, descripcion } = req.body;
    const foroActualizado = await forumService.actualizarForo(id, titulo, descripcion);
    if (!foroActualizado) return res.status(404).json({ mensaje: "Foro no encontrado" });
    res.json({ mensaje: "Foro actualizado correctamente" });
  } catch (error) {
    console.error("\u274C Error al actualizar foro:", error);
    res.status(500).json({ mensaje: "Error al actualizar el foro" });
  }
};
var eliminarForo = async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const foroEliminado = await forumService.eliminarForo(id);
    if (!foroEliminado) return res.status(404).json({ mensaje: "Foro no encontrado" });
    res.json({ mensaje: "Foro eliminado correctamente" });
  } catch (error) {
    console.error("\u274C Error al eliminar foro:", error);
    res.status(500).json({ mensaje: "Error al eliminar el foro" });
  }
};
var obtenerForoConComentarios = async (req, res) => {
  try {
    const foro_id = parseInt(String(req.params.id), 10);
    const foroConComentarios = await forumService.obtenerForoConComentarios(foro_id);
    if (!foroConComentarios) return res.status(404).json({ mensaje: "Foro no encontrado" });
    res.json(foroConComentarios);
  } catch (error) {
    console.error("\u274C Error al obtener foro con comentarios:", error);
    res.status(500).json({ mensaje: "Error al obtener foro con comentarios" });
  }
};

// src/routes/forum.routes.ts
var router7 = Router7();
router7.post("/", crearForo);
router7.get("/", obtenerForos);
router7.get("/:id", obtenerForo);
router7.put("/:id", actualizarForo);
router7.delete("/:id", eliminarForo);
router7.get("/:id/comentarios", obtenerForoConComentarios);
router7.post("/:id/comentarios", crearComentario);
var forum_routes_default = router7;

// src/routes/list.routes.ts
import { Router as Router8 } from "express";

// src/models/lista.model.ts
var ListaModel = class {
  async crearLista(nombre, descripcion, tipo) {
    try {
      const ultimaLista = await prisma.lista.findFirst({
        orderBy: {
          lista_id: "desc"
        },
        select: {
          lista_id: true
        }
      });
      const siguienteId = (ultimaLista?.lista_id ?? 0) + 1;
      const nuevaLista = await prisma.lista.create({
        data: {
          lista_id: siguienteId,
          nombre,
          descripcion,
          tipo
        },
        select: {
          lista_id: true,
          nombre: true,
          descripcion: true,
          tipo: true
        }
      });
      return {
        ...nuevaLista,
        descripcion: nuevaLista.descripcion ?? "",
        tipo: nuevaLista.tipo ?? ""
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error en ListaModel.crearLista:", message);
      throw new Error("No se pudo crear la lista.");
    }
  }
  async obtenerTodas() {
    try {
      const listas = await prisma.lista.findMany({
        orderBy: {
          lista_id: "desc"
        },
        include: {
          lista_libro: {
            include: {
              libro: true
            }
          }
        }
      });
      return listas.map((l) => ({
        ...l,
        descripcion: l.descripcion ?? "",
        tipo: l.tipo ?? "",
        libros: l.lista_libro ? l.lista_libro.map((ll) => ll.libro) : []
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error en ListaModel.obtenerTodas:", message);
      throw new Error("No se pudieron obtener las listas.");
    }
  }
  async obtenerPorId(listaId) {
    try {
      const lista = await prisma.lista.findUnique({
        where: { lista_id: listaId },
        include: {
          lista_libro: {
            include: {
              libro: true
            }
          }
        }
      });
      if (!lista) return null;
      return {
        ...lista,
        descripcion: lista.descripcion ?? "",
        tipo: lista.tipo ?? "",
        libros: lista.lista_libro ? lista.lista_libro.map((ll) => ll.libro) : []
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error en ListaModel.obtenerPorId (${listaId}):`, message);
      throw new Error("No se pudo obtener la lista.");
    }
  }
  async actualizarLista(listaId, nombre, descripcion, tipo) {
    try {
      const camposAActualizar = {
        nombre,
        descripcion,
        tipo
      };
      Object.keys(camposAActualizar).forEach((key) => {
        if (camposAActualizar[key] === void 0) {
          delete camposAActualizar[key];
        }
      });
      if (Object.keys(camposAActualizar).length === 0) {
        throw new Error("No hay campos para actualizar.");
      }
      const updated = await prisma.lista.update({
        where: { lista_id: listaId },
        data: camposAActualizar,
        select: {
          lista_id: true,
          nombre: true,
          descripcion: true,
          tipo: true
        }
      });
      return {
        ...updated,
        descripcion: updated.descripcion ?? "",
        tipo: updated.tipo ?? ""
      };
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error(`Lista con ID ${listaId} no encontrada.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error en ListaModel.actualizarLista:", message);
      throw error;
    }
  }
  async eliminarLista(listaId) {
    try {
      await prisma.lista.delete({
        where: { lista_id: listaId }
      });
      return true;
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error(`Lista con ID ${listaId} no encontrada.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error en ListaModel.eliminarLista:", message);
      throw new Error("No se pudo eliminar la lista.");
    }
  }
};
var listaModel = new ListaModel();

// src/services/list.service.ts
var ListService = class {
  async crearLista(nombre, descripcion, tipo) {
    return await listaModel.crearLista(nombre, descripcion, tipo);
  }
  async obtenerTodas() {
    return await listaModel.obtenerTodas();
  }
  async obtenerPorId(id) {
    return await listaModel.obtenerPorId(id);
  }
  async actualizarLista(id, nombre, descripcion, tipo) {
    return await listaModel.actualizarLista(id, nombre, descripcion, tipo);
  }
  async eliminarLista(id) {
    return await listaModel.eliminarLista(id);
  }
};
var listService = new ListService();

// src/controllers/list.controller.ts
var ListaController = class {
  async crear(req, res) {
    try {
      const { nombre, descripcion, tipo, libroId, bookId, books, bookIds } = req.body;
      const usuarioId = req.user?.id || req.usuarioId;
      if (!nombre || !tipo) {
        return res.status(400).json({ error: "Faltan campos obligatorios (nombre, tipo)." });
      }
      const rawBookId = libroId || bookId || (Array.isArray(books) ? books[0] : null) || (Array.isArray(bookIds) ? bookIds[0] : null);
      const targetBookId = rawBookId ? Number(rawBookId) : null;
      const nuevaLista = await listService.crearLista(nombre, descripcion, tipo);
      let libroAsociado = null;
      if (targetBookId && !isNaN(targetBookId)) {
        try {
          const libroExistente = await prisma.libro?.findUnique({
            where: { libro_id: targetBookId }
          }) || await prisma.book?.findUnique({
            where: { id: targetBookId }
          });
          if (libroExistente) {
            await prisma.lista_libro.create({
              data: {
                lista_id: nuevaLista.lista_id,
                libro_id: targetBookId
              }
            });
            libroAsociado = libroExistente;
          } else {
            console.warn(`[WARN] El libro con ID ${targetBookId} no existe en la base de datos.`);
          }
        } catch (relError) {
          console.error("No se pudo vincular el libro a la lista:", relError);
        }
      }
      try {
        await prisma.actividad_feed.create({
          data: {
            usuario_id: usuarioId ? Number(usuarioId) : null,
            tipo: "AVISO",
            titulo: `Cre\xF3 una nueva lista: "${nombre}"`,
            descripcion: descripcion || `Nueva lista de tipo ${tipo}`
          }
        });
      } catch (feedError) {
        console.error("No se pudo registrar la actividad en el feed:", feedError);
      }
      return res.status(201).json({
        message: "Lista creada correctamente.",
        lista: nuevaLista,
        libro: libroAsociado
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error creando lista:", message);
      return res.status(500).json({ error: "Error interno al crear la lista." });
    }
  }
  async obtenerTodas(req, res) {
    try {
      const listas = await listService.obtenerTodas();
      return res.status(200).json(listas);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error obteniendo listas:", message);
      return res.status(500).json({ error: "Error interno al obtener listas." });
    }
  }
  async obtenerPorId(req, res) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inv\xE1lido." });
      }
      const lista = await listService.obtenerPorId(id);
      if (!lista) {
        return res.status(404).json({ error: "Lista no encontrada." });
      }
      return res.status(200).json(lista);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error obteniendo lista por ID:", message);
      return res.status(500).json({ error: "Error interno." });
    }
  }
  async actualizar(req, res) {
    try {
      const id = parseInt(String(req.params.id), 10);
      const { nombre, descripcion, tipo } = req.body;
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inv\xE1lido." });
      }
      await listService.actualizarLista(id, nombre, descripcion, tipo);
      return res.status(200).json({ message: "Lista actualizada." });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error actualizando lista:", message);
      return res.status(500).json({ error: "Error interno al actualizar." });
    }
  }
  async eliminar(req, res) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inv\xE1lido." });
      }
      await listService.eliminarLista(id);
      return res.status(200).json({ message: "Lista eliminada." });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error eliminando lista:", message);
      return res.status(500).json({ error: "Error interno al eliminar." });
    }
  }
};
var list_controller_default = new ListaController();

// src/routes/list.routes.ts
var router8 = Router8();
router8.get("/", list_controller_default.obtenerTodas);
router8.get("/:id", list_controller_default.obtenerPorId);
router8.post("/", list_controller_default.crear);
router8.put("/:id", list_controller_default.actualizar);
router8.delete("/:id", list_controller_default.eliminar);
var list_routes_default = router8;

// src/routes/medal.routes.ts
import { Router as Router9 } from "express";

// src/services/medal.service.ts
var MedalService = class {
  async obtenerMedallasPorUsuario(usuarioId) {
    return await medalModel.obtenerMedallasPorUsuario(usuarioId);
  }
  async verificarYAsignarMedallas(usuarioId) {
    return await medalModel.verificarYAsignarMedallas(usuarioId);
  }
};
var medalService = new MedalService();

// src/controllers/medal.controller.ts
var obtenerMedallasUsuario = async (req, res) => {
  try {
    const usuario_id = parseInt(String(req.params.usuario_id), 10);
    if (isNaN(usuario_id)) {
      return res.status(400).json({ mensaje: "ID de usuario inv\xE1lido" });
    }
    const medallas = await medalService.obtenerMedallasPorUsuario(usuario_id);
    res.json(medallas);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\u274C Error al obtener medallas del usuario:", error);
    res.status(500).json({ mensaje: "Error al obtener las medallas", detalle: message });
  }
};

// src/routes/medal.routes.ts
var router9 = Router9();
router9.get("/:usuario_id", obtenerMedallasUsuario);
var medal_routes_default = router9;

// src/routes/metaLectura.routes.ts
import { Router as Router10 } from "express";

// src/models/metaLectura.model.ts
var normalizarRangoFechas = (inicio, fin) => {
  const fechaInicio = new Date(inicio);
  const fechaFin = new Date(fin);
  fechaFin.setHours(23, 59, 59, 999);
  return { fechaInicio, fechaFin };
};
var crearMeta = async (datos) => {
  return await prisma.meta_lectura.create({
    data: datos
  });
};
var obtenerMetasPorUsuario = async (usuarioId) => {
  const metas = await prisma.meta_lectura.findMany({
    where: { usuario_id: usuarioId },
    orderBy: { fecha_inicio: "desc" }
  });
  const metasConProgreso = await Promise.all(
    metas.map(async (meta) => {
      const { fechaInicio, fechaFin } = normalizarRangoFechas(meta.fecha_inicio, meta.fecha_fin);
      const librosLeidos = await prisma.opinion.count({
        where: {
          usuario_id: usuarioId,
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      });
      const porcentaje = Math.min(
        100,
        Math.round(librosLeidos / meta.cantidad_libros * 100)
      );
      return {
        ...meta,
        libros_leidos: librosLeidos,
        porcentaje_progreso: isNaN(porcentaje) ? 0 : porcentaje
      };
    })
  );
  return metasConProgreso;
};
var obtenerTodasLasMetas = async () => {
  const metas = await prisma.meta_lectura.findMany({
    include: {
      usuario: {
        select: {
          usuario_id: true,
          nombre: true,
          email: true,
          rol: true
        }
      }
    },
    orderBy: { fecha_inicio: "desc" }
  });
  const metasConProgreso = await Promise.all(
    metas.map(async (meta) => {
      const { fechaInicio, fechaFin } = normalizarRangoFechas(meta.fecha_inicio, meta.fecha_fin);
      const librosLeidos = await prisma.opinion.count({
        where: {
          usuario_id: meta.usuario_id,
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          }
        }
      });
      const porcentaje = Math.min(
        100,
        Math.round(librosLeidos / meta.cantidad_libros * 100)
      );
      return {
        ...meta,
        libros_leidos: librosLeidos,
        porcentaje_progreso: isNaN(porcentaje) ? 0 : porcentaje
      };
    })
  );
  return metasConProgreso;
};
var actualizarMeta = async (metaId, datos) => {
  return await prisma.meta_lectura.update({
    where: { meta_id: metaId },
    data: datos
  });
};
var eliminarMeta = async (metaId, usuarioId) => {
  const whereCondition = { meta_id: metaId };
  if (usuarioId) {
    whereCondition.usuario_id = usuarioId;
  }
  const result = await prisma.meta_lectura.deleteMany({
    where: whereCondition
  });
  return result.count > 0;
};

// src/controllers/metaLectura.controller.ts
var MetaLecturaController = class {
  async crear(req, res) {
    try {
      const usuarioId = req.user?.usuario_id || req.body.usuario_id;
      const { periodo_nombre, cantidad_libros, fecha_inicio, fecha_fin } = req.body;
      if (!usuarioId || !periodo_nombre || !cantidad_libros || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ mensaje: "Faltan campos obligatorios para crear la meta" });
      }
      const nuevaMeta = await crearMeta({
        usuario_id: parseInt(String(usuarioId)),
        periodo_nombre,
        cantidad_libros: parseInt(String(cantidad_libros)),
        fecha_inicio: new Date(fecha_inicio),
        fecha_fin: new Date(fecha_fin)
      });
      res.status(201).json({
        mensaje: "Meta de lectura creada correctamente",
        meta: nuevaMeta
      });
    } catch (error) {
      console.error("Error al crear meta de lectura:", error);
      res.status(500).json({ mensaje: "Error interno al crear la meta" });
    }
  }
  async obtenerMisMetas(req, res) {
    try {
      const usuarioId = req.user?.usuario_id || parseInt(String(req.params.usuarioId));
      if (!usuarioId) {
        return res.status(400).json({ mensaje: "ID de usuario no especificado" });
      }
      const metas = await obtenerMetasPorUsuario(usuarioId);
      res.json(metas);
    } catch (error) {
      console.error("Error al obtener metas de lectura:", error);
      res.status(500).json({ mensaje: "Error al obtener las metas" });
    }
  }
  //----------------------------------------------------------------
  async obtenerTodas(req, res) {
    try {
      const metas = await obtenerTodasLasMetas();
      res.json(metas);
    } catch (error) {
      console.error("Error al obtener todas las metas:", error);
      res.status(500).json({ mensaje: "Error al obtener todas las metas" });
    }
  }
  async actualizar(req, res) {
    try {
      const metaId = parseInt(String(req.params.id));
      const { cantidad_libros, periodo_nombre, fecha_inicio, fecha_fin } = req.body;
      if (!metaId) {
        return res.status(400).json({ mensaje: "ID de meta no especificado" });
      }
      const datosActualizar = {};
      if (cantidad_libros) datosActualizar.cantidad_libros = parseInt(String(cantidad_libros));
      if (periodo_nombre) datosActualizar.periodo_nombre = periodo_nombre;
      if (fecha_inicio) datosActualizar.fecha_inicio = new Date(fecha_inicio);
      if (fecha_fin) datosActualizar.fecha_fin = new Date(fecha_fin);
      const metaActualizada = await actualizarMeta(metaId, datosActualizar);
      res.json({
        mensaje: "Meta actualizada correctamente",
        meta: metaActualizada
      });
    } catch (error) {
      console.error("Error al actualizar la meta:", error);
      res.status(500).json({ mensaje: "Error al actualizar la meta" });
    }
  }
  //---------------------------------------------------------------
  async eliminar(req, res) {
    try {
      const metaId = parseInt(String(req.params.id));
      if (!metaId) {
        return res.status(400).json({ mensaje: "ID de meta no especificado" });
      }
      const eliminado = await eliminarMeta(metaId);
      if (!eliminado) {
        return res.status(404).json({ mensaje: "Meta no encontrada" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error al eliminar meta:", error);
      res.status(500).json({ mensaje: "Error al eliminar la meta" });
    }
  }
};
var metaLectura_controller_default = new MetaLecturaController();

// src/routes/metaLectura.routes.ts
var router10 = Router10();
router10.post("/", verifyToken, metaLectura_controller_default.crear);
router10.get("/", verifyToken, metaLectura_controller_default.obtenerTodas);
router10.get("/usuario/:usuarioId", verifyToken, metaLectura_controller_default.obtenerMisMetas);
router10.put("/:id", verifyToken, metaLectura_controller_default.actualizar);
router10.delete("/:id", verifyToken, metaLectura_controller_default.eliminar);
var metaLectura_routes_default = router10;

// src/routes/readingList.routes.ts
import { Router as Router11 } from "express";
var router11 = Router11();
router11.post("/", list_controller_default.crear);
router11.get("/", list_controller_default.obtenerTodas);
router11.get("/docente/:docente_id", list_controller_default.obtenerTodas);
router11.put("/:lista_id/:docente_id", list_controller_default.actualizar);
router11.delete("/:lista_id/:docente_id", list_controller_default.eliminar);
var readingList_routes_default = router11;

// src/routes/review.routes.ts
import { Router as Router12 } from "express";

// src/models/opinion.model.ts
var OpinionModel = class {
  async getAllOpinions() {
    try {
      const opiniones = await prisma.opinion.findMany({
        include: {
          usuario: {
            select: { nombre: true }
          },
          libro: {
            select: { titulo: true }
          }
        },
        orderBy: {
          fecha: "desc"
        }
      });
      return opiniones.map((o) => ({
        opinion_id: o.opinion_id,
        usuario_id: o.usuario_id,
        usuario_nombre: o.usuario?.nombre ?? "",
        libro_id: o.libro_id,
        libro_titulo: o.libro?.titulo ?? "",
        calificacion: o.calificacion,
        comentario: o.comentario ?? "",
        fecha: o.fecha ?? /* @__PURE__ */ new Date()
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error OpinionModel.getAllOpinions:", message);
      throw new Error("Failed to retrieve opinions.");
    }
  }
  async getOpinionById(opinionId) {
    try {
      const o = await prisma.opinion.findUnique({
        where: { opinion_id: opinionId },
        include: {
          usuario: {
            select: { nombre: true }
          },
          libro: {
            select: { titulo: true }
          }
        }
      });
      if (!o) return null;
      return {
        opinion_id: o.opinion_id,
        usuario_id: o.usuario_id,
        usuario_nombre: o.usuario?.nombre ?? "",
        libro_id: o.libro_id,
        libro_titulo: o.libro?.titulo ?? "",
        calificacion: o.calificacion,
        comentario: o.comentario ?? "",
        fecha: o.fecha ?? /* @__PURE__ */ new Date()
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error OpinionModel.getOpinionById:", message);
      throw error;
    }
  }
  async createOpinion(opinionData) {
    const { usuario_id, libro_id, calificacion, comentario } = opinionData;
    const fecha = /* @__PURE__ */ new Date();
    try {
      const nuevaOpinion = await prisma.opinion.create({
        data: {
          usuario_id,
          libro_id,
          calificacion,
          comentario,
          fecha
        },
        include: {
          usuario: {
            select: { nombre: true }
          }
        }
      });
      return {
        opinion_id: nuevaOpinion.opinion_id,
        usuario_id: nuevaOpinion.usuario_id,
        usuario_nombre: nuevaOpinion.usuario?.nombre ?? "",
        libro_id: nuevaOpinion.libro_id,
        calificacion: nuevaOpinion.calificacion,
        comentario: nuevaOpinion.comentario ?? "",
        fecha: nuevaOpinion.fecha ?? fecha
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error OpinionModel.createOpinion:", message);
      throw error;
    }
  }
  async updateOpinion(opinionId, updatedFields) {
    const dataToUpdate = {};
    Object.keys(updatedFields).forEach((key) => {
      const val = updatedFields[key];
      if (val !== void 0) {
        dataToUpdate[key] = val;
      }
    });
    if (Object.keys(dataToUpdate).length === 0) {
      throw new Error("No data provided for update.");
    }
    try {
      const updated = await prisma.opinion.update({
        where: { opinion_id: opinionId },
        data: dataToUpdate
      });
      return {
        opinion_id: updated.opinion_id,
        usuario_id: updated.usuario_id,
        libro_id: updated.libro_id,
        calificacion: updated.calificacion,
        comentario: updated.comentario ?? "",
        fecha: updated.fecha ?? /* @__PURE__ */ new Date()
      };
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error(`Opinion ID ${opinionId} not found.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error OpinionModel.updateOpinion:", message);
      throw error;
    }
  }
  async deleteOpinion(opinionId) {
    try {
      await prisma.opinion.delete({
        where: { opinion_id: opinionId }
      });
      return true;
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error(`Opinion ID ${opinionId} not found.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error OpinionModel.deleteOpinion:", message);
      throw error;
    }
  }
  async getOpinionsByLibro(libroId) {
    try {
      const opiniones = await prisma.opinion.findMany({
        where: { libro_id: libroId },
        include: {
          usuario: {
            select: { nombre: true }
          }
        },
        orderBy: {
          fecha: "desc"
        }
      });
      return opiniones.map((o) => ({
        opinion_id: o.opinion_id,
        usuario_id: o.usuario_id,
        usuario_nombre: o.usuario?.nombre ?? "",
        libro_id: o.libro_id,
        calificacion: o.calificacion,
        comentario: o.comentario ?? "",
        fecha: o.fecha ?? /* @__PURE__ */ new Date()
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error OpinionModel.getOpinionsByLibro:", message);
      throw new Error("Failed to retrieve opinions for libro.");
    }
  }
};
var opinionModel = new OpinionModel();

// src/services/review.service.ts
import leoProfanity from "leo-profanity";
leoProfanity.loadDictionary("en");
leoProfanity.loadDictionary("es");
leoProfanity.add(["mierda", "pelotudo", "boludo", "Estupido"]);
var ReviewService = class {
  limpiarComentario(comentario) {
    return leoProfanity.clean(comentario);
  }
  async getAllOpinions() {
    return await opinionModel.getAllOpinions();
  }
  async getOpinionById(id) {
    return await opinionModel.getOpinionById(id);
  }
  async createOpinion(data) {
    const comentarioLimpio = this.limpiarComentario(data.comentario);
    const newOpinion = await opinionModel.createOpinion({
      ...data,
      comentario: comentarioLimpio
    });
    await medalService.verificarYAsignarMedallas(data.usuario_id);
    return newOpinion;
  }
  async updateOpinion(id, data) {
    if (data.comentario) {
      data.comentario = this.limpiarComentario(data.comentario);
    }
    return await opinionModel.updateOpinion(id, data);
  }
  async deleteOpinion(id) {
    return await opinionModel.deleteOpinion(id);
  }
  async getOpinionsByLibro(libroId) {
    return await opinionModel.getOpinionsByLibro(libroId);
  }
};
var reviewService = new ReviewService();

// src/controllers/review.controller.ts
var ReviewController = class {
  async getAllOpinions(req, res) {
    try {
      const opinions = await reviewService.getAllOpinions();
      return res.status(200).json(opinions);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting opinions:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async getOpinionById(req, res) {
    try {
      const opinionId = parseInt(String(req.params.id), 10);
      if (isNaN(opinionId)) {
        return res.status(400).json({ error: "Invalid opinion ID" });
      }
      const opinion = await reviewService.getOpinionById(opinionId);
      if (!opinion) {
        return res.status(404).json({ error: "Opinion not found" });
      }
      return res.status(200).json(opinion);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting opinion by ID:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async createOpinion(req, res) {
    try {
      const { usuario_id, libro_id, calificacion, comentario } = req.body;
      if (!usuario_id || !libro_id || !calificacion || !comentario) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const newOpinion = await reviewService.createOpinion({
        usuario_id,
        libro_id,
        calificacion,
        comentario
      });
      return res.status(201).json(newOpinion);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error creating opinion:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async updateOpinion(req, res) {
    try {
      const opinionId = parseInt(String(req.params.id), 10);
      if (isNaN(opinionId)) {
        return res.status(400).json({ error: "Invalid opinion ID" });
      }
      const existingOpinion = await reviewService.getOpinionById(opinionId);
      if (!existingOpinion) {
        return res.status(404).json({ error: "Opinion not found" });
      }
      const userId = req.userId;
      const userRole = req.userRole;
      if (userRole !== 3 && userId !== existingOpinion.usuario_id) {
        return res.status(403).json({ error: "Not authorized to modify this opinion" });
      }
      const updatedFields = req.body;
      const updatedOpinion = await reviewService.updateOpinion(opinionId, updatedFields);
      return res.status(200).json(updatedOpinion);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error updating opinion:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async deleteOpinion(req, res) {
    try {
      const opinionId = parseInt(String(req.params.id), 10);
      if (isNaN(opinionId)) {
        return res.status(400).json({ error: "Invalid opinion ID" });
      }
      const existingOpinion = await reviewService.getOpinionById(opinionId);
      if (!existingOpinion) {
        return res.status(404).json({ error: "Opinion not found" });
      }
      const userId = req.userId;
      const userRole = req.userRole;
      if (userRole !== 3 && userId !== existingOpinion.usuario_id) {
        return res.status(403).json({ error: "Not authorized to delete this opinion" });
      }
      await reviewService.deleteOpinion(opinionId);
      return res.status(204).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error deleting opinion:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async getOpinionsByLibro(req, res) {
    try {
      const libroIdParam = req.params.bookId || req.params.libro_id;
      const libroId = parseInt(String(libroIdParam), 10);
      if (isNaN(libroId)) {
        return res.status(400).json({ error: "Invalid libro ID" });
      }
      const sqlOpinions = await reviewService.getOpinionsByLibro(libroId);
      return res.status(200).json(sqlOpinions);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting opinions by libro:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};
var review_controller_default = new ReviewController();

// src/routes/review.routes.ts
var router12 = Router12();
router12.get("/", review_controller_default.getAllOpinions.bind(review_controller_default));
router12.get("/:id", review_controller_default.getOpinionById.bind(review_controller_default));
router12.post("/", verifyToken, review_controller_default.createOpinion.bind(review_controller_default));
router12.put("/:id", verifyToken, review_controller_default.updateOpinion.bind(review_controller_default));
router12.delete("/:id", verifyToken, review_controller_default.deleteOpinion.bind(review_controller_default));
router12.get("/book/:bookId", review_controller_default.getOpinionsByLibro.bind(review_controller_default));
router12.get("/libro/:bookId", review_controller_default.getOpinionsByLibro.bind(review_controller_default));
var review_routes_default = router12;

// src/routes/user.routes.ts
import { Router as Router13 } from "express";

// src/services/user.service.ts
var UserService = class {
  async getAllUsers() {
    return await userModel.getAllUsers();
  }
  async getUserById(id) {
    return await userModel.getUserById(id);
  }
  async createUser(userData) {
    return await userModel.createUser(userData);
  }
  async updateUser(id, userData) {
    return await userModel.updateUser(id, userData);
  }
  async deleteUser(id) {
    return await userModel.deleteUser(id);
  }
};
var userService = new UserService();

// src/controllers/user.controller.ts
var UserController = class {
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting users:", message);
      res.status(500).json({ error: "Database connection not established" });
    }
  }
  async createUser(req, res) {
    try {
      const newUser = req.body;
      if (!newUser.nombre || !newUser.email || !newUser.contrasena || !newUser.rol_id) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const result = await userService.createUser(newUser);
      res.status(201).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error creating user:", message);
      res.status(500).json({ error: "Database connection not established" });
    }
  }
  async updateUser(req, res) {
    try {
      const userId = parseInt(String(req.params.id), 10);
      const updatedUser = req.body;
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      const result = await userService.updateUser(userId, updatedUser);
      return res.status(200).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("not found")) {
        return res.status(404).json({ error: errorMessage });
      }
      if (errorMessage.includes("No data provided")) {
        return res.status(400).json({ error: errorMessage });
      }
      console.error("Error updating user:", errorMessage);
      return res.status(500).json({ error: "Internal server error: Failed to process update." });
    }
  }
  async deleteUser(req, res) {
    try {
      const userId = parseInt(String(req.params.id), 10);
      if (!userId) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      await userService.deleteUser(userId);
      return res.status(204).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error deleting user:", message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  async getUserById(req, res) {
    try {
      const userId = parseInt(String(req.params.id), 10);
      if (!userId) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const user = await userService.getUserById(userId);
      if (user) {
        return res.status(200).json(user);
      } else {
        return res.status(404).json({ error: `User not found` });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting user by ID:", message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};
var user_controller_default = new UserController();

// src/routes/user.routes.ts
var router13 = Router13();
var roldAdmin = 3;
router13.get(
  "/",
  /*verifyToken, requireRole(roldAdmin),*/
  user_controller_default.getAllUsers
);
router13.get("/:id", verifyToken, user_controller_default.getUserById);
router13.post("/", user_controller_default.createUser);
router13.put("/:id", verifyToken, user_controller_default.updateUser);
router13.delete("/:id", verifyToken, requireRole(roldAdmin), user_controller_default.deleteUser);
var user_routes_default = router13;

// src/routes/radio.routes.ts
import { Router as Router14 } from "express";

// src/services/radioScraper.service.ts
import axios from "axios";
import * as cheerio from "cheerio";
var PROGRAMAS_URL = "https://sites.google.com/sabato.unicen.edu.ar/radiosabato/programas";
var sincronizarRadioSabato = async () => {
  try {
    const { data: html } = await axios.get(PROGRAMAS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const resultados = [];
    const idsEncontrados = /* @__PURE__ */ new Set();
    const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|file\/d\/)([a-zA-Z0-9_-]{25,})/g;
    let match;
    while ((match = driveRegex.exec(html)) !== null) {
      const fileId = match[1];
      if (!idsEncontrados.has(fileId)) {
        idsEncontrados.add(fileId);
        const audioUrl = `https://drive.google.com/file/d/${fileId}/preview`;
        resultados.push({
          titulo: `Programa Radio S\xE1bato (Drive ID: ${fileId.substring(0, 6)}...)`,
          audio_url: audioUrl,
          programa: "Radio S\xE1bato",
          descripcion: "Programa extra\xEDdo de la secci\xF3n oficial de Radio S\xE1bato."
        });
      }
    }
    const $ = cheerio.load(html);
    $('a[href*=".mp3"]').each((_, elem) => {
      const href = $(elem).attr("href");
      if (href) {
        resultados.push({
          titulo: $(elem).text().trim() || "Programa de Radio",
          audio_url: href,
          programa: "Radio S\xE1bato",
          descripcion: "Archivo de audio en vivo / descarga directas."
        });
      }
    });
    return resultados;
  } catch (error) {
    console.error("Error al realizar el scraping de Radio S\xE1bato:", error);
    return [];
  }
};

// src/models/radio.model.ts
import { TipoActividad as TipoActividad2 } from "@prisma/client";
var crearEpisodioDB = async (titulo, audio_url, descripcion, programa, creador_id) => {
  const episodio = await prisma.radio_episodio.create({
    data: {
      titulo,
      audio_url,
      descripcion: descripcion ?? null,
      programa: programa ?? null
    },
    select: {
      episodio_id: true
    }
  });
  try {
    await prisma.actividad_feed.create({
      data: {
        usuario_id: creador_id ? Number(creador_id) : null,
        tipo: TipoActividad2.RADIO_EPISODIO,
        titulo: `Nuevo episodio de Radio S\xE1bato: ${titulo}`,
        descripcion: descripcion ?? void 0,
        entidad_id: episodio.episodio_id
      }
    });
  } catch (error) {
    console.error("\u26A0\uFE0F No se pudo registrar la actividad en el feed:", error);
  }
  return episodio;
};
var obtenerTodosEpisodiosDB = async () => {
  const episodios = await prisma.radio_episodio.findMany({
    orderBy: {
      fecha_emision: "desc"
    }
  });
  return episodios.map((e) => ({
    episodio_id: e.episodio_id,
    titulo: e.titulo,
    descripcion: e.descripcion,
    audio_url: e.audio_url,
    programa: e.programa,
    fecha_emision: e.fecha_emision ?? /* @__PURE__ */ new Date()
  }));
};
var obtenerEpisodioPorIdDB = async (episodio_id) => {
  const e = await prisma.radio_episodio.findUnique({
    where: { episodio_id }
  });
  if (!e) return null;
  return {
    episodio_id: e.episodio_id,
    titulo: e.titulo,
    descripcion: e.descripcion,
    audio_url: e.audio_url,
    programa: e.programa,
    fecha_emision: e.fecha_emision ?? /* @__PURE__ */ new Date()
  };
};
var eliminarEpisodioDB = async (episodio_id) => {
  try {
    const result = await prisma.radio_episodio.delete({
      where: { episodio_id },
      select: {
        episodio_id: true
      }
    });
    return result;
  } catch (error) {
    return null;
  }
};

// src/controllers/radio.controller.ts
var obtenerTodosEpisodios = async (req, res) => {
  try {
    const episodios = await obtenerTodosEpisodiosDB();
    return res.status(200).json(episodios);
  } catch (error) {
    console.error("Error al obtener episodios:", error);
    return res.status(500).json({ mensaje: "Error al obtener los episodios" });
  }
};
var obtenerEpisodioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const episodio = await obtenerEpisodioPorIdDB(Number(id));
    if (!episodio) {
      return res.status(404).json({ mensaje: "Episodio no encontrado" });
    }
    return res.status(200).json(episodio);
  } catch (error) {
    console.error("Error al obtener el episodio:", error);
    return res.status(500).json({ mensaje: "Error al obtener el episodio" });
  }
};
var crearEpisodio = async (req, res) => {
  try {
    const { titulo, audio_url, descripcion, programa } = req.body;
    if (!titulo || !audio_url) {
      return res.status(400).json({ mensaje: "El t\xEDtulo y la URL del audio son obligatorios" });
    }
    const nuevoEpisodio = await crearEpisodioDB(
      titulo,
      audio_url,
      descripcion,
      programa
    );
    return res.status(201).json(nuevoEpisodio);
  } catch (error) {
    console.error("Error al crear episodio:", error);
    return res.status(500).json({ mensaje: "Error al crear el episodio" });
  }
};
var eliminarEpisodio = async (req, res) => {
  try {
    const { id } = req.params;
    await eliminarEpisodioDB(Number(id));
    return res.status(200).json({ mensaje: "Episodio eliminado con \xE9xito" });
  } catch (error) {
    console.error("Error al eliminar episodio:", error);
    return res.status(500).json({ mensaje: "Error al eliminar el episodio" });
  }
};
var sincronizarProgramas = async (req, res) => {
  try {
    const programasScraped = await sincronizarRadioSabato();
    const episodiosExistentes = await obtenerTodosEpisodiosDB();
    let agregados = 0;
    for (const prog of programasScraped) {
      const existe = episodiosExistentes.some((e) => e.audio_url === prog.audio_url);
      if (!existe) {
        await crearEpisodioDB(
          prog.titulo,
          prog.audio_url,
          prog.descripcion,
          prog.programa
        );
        agregados++;
      }
    }
    return res.status(200).json({
      mensaje: "Sincronizaci\xF3n completada con \xE9xito",
      agregados
    });
  } catch (error) {
    console.error("Error al sincronizar programas:", error);
    return res.status(500).json({ mensaje: "Error al sincronizar programas de radio" });
  }
};

// src/routes/radio.routes.ts
var router14 = Router14();
router14.get("/", obtenerTodosEpisodios);
router14.post("/sincronizar", verifyToken, sincronizarProgramas);
router14.get("/:id", obtenerEpisodioPorId);
router14.post("/", verifyToken, requireRole(1), crearEpisodio);
router14.delete("/:id", verifyToken, requireRole(1), eliminarEpisodio);
var radio_routes_default = router14;

// server.ts
var app = express();
var PORT = process.env.PORT || 3e3;
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "https://statuesque-truffle-a9d0a3.netlify.app",
      "https://sababook-back.onrender.com"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);
app.use(express.json());
app.use("/api/v1/auth", auth_routes_default);
app.use("/api/v1/books", book_routes_default);
app.use("/api/v1/comments", comment_routes_default);
app.use("/api/v1/favorites", favorite_routes_default);
app.use("/api/v1/medal", medal_routes_default);
app.use("/api/v1/metas-lectura", metaLectura_routes_default);
app.use("/api/v1/feed", feed_routes_default);
app.use("/api/v1/forums", forum_routes_default);
app.use("/api/v1/lists", list_routes_default);
app.use("/api/v1/reading-lists", readingList_routes_default);
app.use("/api/v1/reviews", review_routes_default);
app.use("/api/v1/users", user_routes_default);
app.use("/api/v1/radio", radio_routes_default);
app.use("/api/v1/cafes", cafe_routes_default);
app.use("/api/v1/user", user_routes_default);
app.use("/api/v1/usuario", user_routes_default);
app.use("/api/v1/usuarios", user_routes_default);
app.use("/api/v1/libro", book_routes_default);
app.use("/api/v1/libros", book_routes_default);
app.use("/api/v1/muro", feed_routes_default);
app.use("/api/v1/opinion", review_routes_default);
app.use("/api/v1/opiniones", review_routes_default);
app.use("/api/v1/comentarios", comment_routes_default);
app.use("/api/v1/lista-lectura", readingList_routes_default);
app.use("/api/v1/radio-sabato", radio_routes_default);
app.use("/api/v1/cafe", cafe_routes_default);
app.get("/", (req, res) => {
  res.status(200).send("Hello World!\n");
});
testConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error("Database connection error:", error);
  process.exit(1);
});

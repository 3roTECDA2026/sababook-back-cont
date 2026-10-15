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
          rol: true,
          avatar_url: true,
          nivel_educativo: true,
          perfil_completo: true,
          fecha_registro: true
        }
      });
      if (!user) {
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

// src/utils/pagination.ts
var toInt = (v) => {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : void 0;
};
var isEmpty = (v) => v === void 0 || v === null || v === "";
function parsePagination(query, defaultLimit = 10, maxLimit = 50) {
  if (isEmpty(query.page) && isEmpty(query.limit)) return null;
  const page = Math.max(toInt(query.page) ?? 1, 1);
  const limit = Math.min(Math.max(toInt(query.limit) ?? defaultLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}
function buildPaginated(data, total, { page, limit }) {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return { data, total, page, limit, totalPages, hasMore: page < totalPages };
}

// src/models/user.model.ts
import { TipoRol } from "@prisma/client";
var UserModel = class {
  async getAllUsers() {
    try {
      const users = await prisma.usuario.findMany({
        orderBy: {
          usuario_id: "asc"
        }
      });
      return users.map((u) => ({
        usuario_id: u.usuario_id,
        nombre: u.nombre,
        email: u.email,
        rol: u.rol,
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
      rol = TipoRol.ALUMNO,
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
          rol,
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
          rol: true
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
        rol: updatedUser.rol,
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
        where: { usuario_id: userId }
      });
      if (!user) return null;
      return {
        usuario_id: user.usuario_id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
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
  async getUsersPaginated(pagination) {
    try {
      const [users, total] = await prisma.$transaction([
        prisma.usuario.findMany({
          orderBy: { usuario_id: "asc" },
          skip: pagination.skip,
          take: pagination.limit
        }),
        prisma.usuario.count()
      ]);
      const data = users.map((u) => ({
        usuario_id: u.usuario_id,
        nombre: u.nombre,
        email: u.email,
        rol: u.rol,
        fecha_registro: u.fecha_registro ?? /* @__PURE__ */ new Date(),
        perfil_completo: u.perfil_completo ?? false,
        avatar_url: u.avatar_url,
        nivel_educativo: u.nivel_educativo
      }));
      return buildPaginated(data, total, pagination);
    } catch (error) {
      console.error("Error UserModel.getUsersPaginated:", error);
      throw new Error("Failed to retrieve users.");
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
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET_NOT_CONFIGURED");
    }
    const payload = {
      usuario_id: user.usuario_id,
      nombre: user.nombre,
      rol: user.rol
    };
    const token = jwt.sign(payload, secret, { expiresIn: "1h", algorithm: "HS256" });
    return {
      message: "Inicio de sesi\xF3n exitoso.",
      token,
      userId: user.usuario_id,
      rol: user.rol,
      user: {
        usuario_id: user.usuario_id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        avatar_url: user.avatar_url,
        nivel_educativo: user.nivel_educativo,
        perfil_completo: user.perfil_completo,
        fecha_registro: user.fecha_registro
      }
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
var buscarLibros = async (filtros) => {
  try {
    return await prisma.libro.findMany({ where: construirWhere(filtros) });
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
var construirWhere = ({ query, genero, nivel_educativo }) => {
  const where = {};
  if (query && query.trim() !== "") {
    const cleanQuery = query.trim();
    where.OR = [
      { titulo: { contains: cleanQuery, mode: "insensitive" } },
      { autor: { contains: cleanQuery, mode: "insensitive" } }
    ];
  }
  if (genero) where.genero = genero;
  if (nivel_educativo) where.nivel_educativo = nivel_educativo;
  return where;
};
var buscarLibrosPaginado = async (filtros, pagination) => {
  try {
    const where = construirWhere(filtros);
    const [data, total] = await prisma.$transaction([
      prisma.libro.findMany({
        where,
        orderBy: { libro_id: "asc" },
        // orden estable: evita repetidos/saltos
        skip: pagination.skip,
        take: pagination.limit
      }),
      prisma.libro.count({ where })
    ]);
    return buildPaginated(data, total, pagination);
  } catch (error) {
    console.error("Error al buscar libros paginados:", error);
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
  async buscarLibrosPaginado(filters, pagination) {
    return await buscarLibrosPaginado(filters, pagination);
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
      const { query, genero, nivel_educativo } = req.query;
      const filtros = { query, genero, nivel_educativo };
      const pagination = parsePagination(req.query);
      if (pagination) {
        const resultado = await bookService.buscarLibrosPaginado(filtros, pagination);
        return res.json(resultado);
      }
      const libros = await bookService.buscarLibros(filtros);
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

// src/middleware/auth.middleware.ts
import jwt2 from "jsonwebtoken";
import { TipoRol as TipoRol2 } from "@prisma/client";
var verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "Server configuration error: JWT_SECRET not configured" });
  }
  try {
    const decoded = jwt2.verify(token, secret, { algorithms: ["HS256"] });
    req.userId = decoded.usuario_id ?? decoded.id;
    req.userRole = decoded.rol ?? TipoRol2.ALUMNO;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
var optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next();
  }
  try {
    const decoded = jwt2.verify(token, secret, { algorithms: ["HS256"] });
    req.userId = decoded.usuario_id ?? decoded.id;
    req.userRole = decoded.rol ?? TipoRol2.ALUMNO;
  } catch {
    req.userId = void 0;
    req.userRole = void 0;
  }
  next();
};
var requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ error: "Acceso denegado. Permisos insuficientes." });
    }
    next();
  };
};
var requireAdmin = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Autenticaci\xF3n requerida." });
  }
  try {
    const user = await prisma.usuario.findUnique({
      where: { usuario_id: req.userId },
      select: { rol: true }
    });
    if (user?.rol !== TipoRol2.ADMINISTRADOR) {
      return res.status(403).json({ error: "Acceso denegado. Se requiere rol administrador." });
    }
    return next();
  } catch (error) {
    console.error("Error al verificar permisos de administrador:", error);
    return res.status(500).json({ error: "No se pudieron verificar los permisos." });
  }
};

// src/routes/book.routes.ts
var router2 = Router2();
router2.get("/", book_controller_default.obtenerCatalogo);
router2.get("/buscar", book_controller_default.buscar);
router2.get("/:id", book_controller_default.verDetalle);
router2.post("/", verifyToken, requireAdmin, book_controller_default.crear);
router2.put("/:id", verifyToken, requireAdmin, book_controller_default.actualizar);
router2.delete("/:id", verifyToken, requireAdmin, book_controller_default.eliminar);
router2.patch("/inactivar/:id", verifyToken, requireAdmin, book_controller_default.eliminacionLogica);
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
  // Obtener el catálogo completo de insignias, marcando cuáles tiene el usuario
  async obtenerCatalogoConEstado(usuario_id) {
    try {
      const medallas = await prisma.medalla.findMany({
        orderBy: { medalla_id: "asc" },
        include: {
          usuario_medalla: {
            where: { usuario_id }
          }
        }
      });
      return medallas.map((m) => ({
        medalla_id: m.medalla_id,
        nombre: m.nombre,
        descripcion: m.descripcion ?? "",
        tipo_accion: m.tipo_accion ?? "",
        obtenida: m.usuario_medalla.length > 0,
        fecha_obtenida: m.usuario_medalla[0]?.fecha_obtenida ?? null
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error al obtener el cat\xE1logo de insignias:", message);
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

// src/routes/course.routes.ts
import { Router as Router5 } from "express";

// src/controllers/course.controller.ts
import { Prisma } from "@prisma/client";

// src/models/course.model.ts
var obtenerCursosDB = async (filtros) => {
  const cursos = await prisma.curso.findMany({
    where: {
      anio_lectivo: filtros.anio_lectivo,
      materia_id: filtros.materia_id,
      curso_docente: filtros.docente_id ? { some: { usuario_id: filtros.docente_id } } : void 0
    },
    include: {
      materia: { select: { materia_id: true, nombre: true } },
      _count: { select: { curso_docente: true, curso_libro: true } }
    },
    orderBy: [{ anio_lectivo: "desc" }, { anio: "asc" }, { division: "asc" }]
  });
  return cursos.map((c) => ({
    curso_id: c.curso_id,
    anio: c.anio,
    division: c.division,
    anio_lectivo: c.anio_lectivo,
    materia: c.materia,
    cantidad_docentes: c._count.curso_docente,
    cantidad_libros: c._count.curso_libro
  }));
};
var obtenerCursoPorIdDB = async (curso_id) => {
  const c = await prisma.curso.findUnique({
    where: { curso_id },
    include: {
      materia: { select: { materia_id: true, nombre: true } },
      curso_docente: {
        include: { usuario: { select: { usuario_id: true, nombre: true, email: true } } }
      },
      curso_libro: {
        include: {
          libro: { select: { libro_id: true, titulo: true, autor: true, portada_url: true } }
        }
      }
    }
  });
  if (!c) return null;
  return {
    curso_id: c.curso_id,
    anio: c.anio,
    division: c.division,
    anio_lectivo: c.anio_lectivo,
    materia: c.materia,
    docentes: c.curso_docente.map((cd) => cd.usuario),
    libros: c.curso_libro.map((cl) => ({ ...cl.libro, puntaje: cl.puntaje }))
  };
};
var existeCursoDB = async (curso_id) => {
  const cantidad = await prisma.curso.count({ where: { curso_id } });
  return cantidad > 0;
};
var crearCursoDB = async (datos) => {
  return await prisma.curso.create({ data: datos });
};
var actualizarCursoDB = async (curso_id, datos) => {
  return await prisma.curso.update({ where: { curso_id }, data: datos });
};
var eliminarCursoDB = async (curso_id) => {
  await prisma.curso.delete({ where: { curso_id } });
};
var obtenerRolUsuarioDB = async (usuario_id) => {
  return await prisma.usuario.findUnique({
    where: { usuario_id },
    select: { rol: true }
  });
};
var asignarDocenteDB = async (curso_id, usuario_id) => {
  return await prisma.curso_docente.create({ data: { curso_id, usuario_id } });
};
var quitarDocenteDB = async (curso_id, usuario_id) => {
  await prisma.curso_docente.delete({
    where: { curso_id_usuario_id: { curso_id, usuario_id } }
  });
};
var esDocenteDelCursoDB = async (curso_id, usuario_id) => {
  const cantidad = await prisma.curso_docente.count({ where: { curso_id, usuario_id } });
  return cantidad > 0;
};
var obtenerLibrosDelCursoDB = async (curso_id) => {
  const filas = await prisma.curso_libro.findMany({
    where: { curso_id },
    include: {
      libro: { select: { libro_id: true, titulo: true, autor: true, portada_url: true } }
    },
    orderBy: { libro: { titulo: "asc" } }
  });
  return filas.map((f) => ({ ...f.libro, puntaje: f.puntaje }));
};
var asignarLibroDB = async (curso_id, libro_id, puntaje) => {
  return await prisma.curso_libro.create({ data: { curso_id, libro_id, puntaje } });
};
var actualizarPuntajeLibroDB = async (curso_id, libro_id, puntaje) => {
  return await prisma.curso_libro.update({
    where: { curso_id_libro_id: { curso_id, libro_id } },
    data: { puntaje }
  });
};
var quitarLibroDB = async (curso_id, libro_id) => {
  await prisma.curso_libro.delete({
    where: { curso_id_libro_id: { curso_id, libro_id } }
  });
};

// src/services/course.service.ts
import { TipoRol as TipoRol3 } from "@prisma/client";
var ErrorNegocio = class extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
};
var CourseService = class {
  async obtenerTodos(filtros) {
    return await obtenerCursosDB(filtros);
  }
  async obtenerPorId(curso_id) {
    return await obtenerCursoPorIdDB(curso_id);
  }
  async crear(datos) {
    return await crearCursoDB(datos);
  }
  async actualizar(curso_id, datos) {
    return await actualizarCursoDB(curso_id, datos);
  }
  async eliminar(curso_id) {
    await eliminarCursoDB(curso_id);
  }
  // Solo se pueden asignar usuarios con rol docente
  async asignarDocente(curso_id, usuario_id) {
    const usuario = await obtenerRolUsuarioDB(usuario_id);
    if (!usuario) {
      throw new ErrorNegocio(404, "Usuario no encontrado.");
    }
    if (usuario.rol !== TipoRol3.DOCENTE) {
      throw new ErrorNegocio(400, "El usuario indicado no tiene rol docente.");
    }
    return await asignarDocenteDB(curso_id, usuario_id);
  }
  async quitarDocente(curso_id, usuario_id) {
    await quitarDocenteDB(curso_id, usuario_id);
  }
  // El administrador gestiona los libros de cualquier curso;
  // el docente, solo los de los cursos que tiene asignados
  async verificarPermisoLibros(curso_id, usuario_id) {
    if (!usuario_id) {
      throw new ErrorNegocio(401, "Autenticaci\xF3n requerida.");
    }
    const usuario = await obtenerRolUsuarioDB(usuario_id);
    if (usuario?.rol === TipoRol3.ADMINISTRADOR) return;
    if (usuario?.rol === TipoRol3.DOCENTE && await esDocenteDelCursoDB(curso_id, usuario_id)) {
      return;
    }
    throw new ErrorNegocio(
      403,
      "Acceso denegado. Solo el administrador o un docente del curso pueden gestionar sus libros."
    );
  }
  async obtenerLibros(curso_id) {
    if (!await existeCursoDB(curso_id)) {
      throw new ErrorNegocio(404, "Curso no encontrado.");
    }
    return await obtenerLibrosDelCursoDB(curso_id);
  }
  async asignarLibro(curso_id, libro_id, puntaje, usuario_id) {
    await this.verificarPermisoLibros(curso_id, usuario_id);
    return await asignarLibroDB(curso_id, libro_id, puntaje);
  }
  async actualizarPuntajeLibro(curso_id, libro_id, puntaje, usuario_id) {
    await this.verificarPermisoLibros(curso_id, usuario_id);
    return await actualizarPuntajeLibroDB(curso_id, libro_id, puntaje);
  }
  async quitarLibro(curso_id, libro_id, usuario_id) {
    await this.verificarPermisoLibros(curso_id, usuario_id);
    await quitarLibroDB(curso_id, libro_id);
  }
};
var courseService = new CourseService();

// src/controllers/course.controller.ts
var CURSO_NO_ENCONTRADO = { status: 404, mensaje: "Curso no encontrado." };
var CURSO_DUPLICADO = {
  status: 409,
  mensaje: "Ya existe un curso con ese a\xF1o, divisi\xF3n y a\xF1o lectivo."
};
var responderError = (res, error, mapa = {}) => {
  if (error instanceof ErrorNegocio) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && mapa[error.code]) {
    const { status, mensaje } = mapa[error.code];
    res.status(status).json({ error: mensaje });
    return true;
  }
  return false;
};
var parsearEntero = (valor) => {
  if (valor === void 0 || valor === null || valor === "") return null;
  const numero = Number(valor);
  return Number.isInteger(numero) ? numero : null;
};
var parsearId = (valor) => {
  const id = parsearEntero(valor);
  return id !== null && id > 0 ? id : null;
};
var validarDatosCurso = (body, parcial) => {
  const datos = {};
  if (body.anio !== void 0) {
    const anio = parsearEntero(body.anio);
    if (anio === null || anio < 1 || anio > 7) {
      return { datos, error: "El a\xF1o debe ser un n\xFAmero entero entre 1 y 7." };
    }
    datos.anio = anio;
  } else if (!parcial) {
    return { datos, error: "El a\xF1o es obligatorio." };
  }
  if (body.division !== void 0) {
    if (typeof body.division !== "string" || body.division.trim() === "" || body.division.trim().length > 5) {
      return { datos, error: "La divisi\xF3n debe tener entre 1 y 5 caracteres." };
    }
    datos.division = body.division.trim().toUpperCase();
  } else if (!parcial) {
    return { datos, error: "La divisi\xF3n es obligatoria." };
  }
  if (body.anio_lectivo !== void 0) {
    const anioLectivo = parsearEntero(body.anio_lectivo);
    if (anioLectivo === null || anioLectivo < 2e3 || anioLectivo > 2100) {
      return { datos, error: "El a\xF1o lectivo no es v\xE1lido." };
    }
    datos.anio_lectivo = anioLectivo;
  } else if (!parcial) {
    return { datos, error: "El a\xF1o lectivo es obligatorio." };
  }
  if (body.materia_id !== void 0) {
    const materiaId = parsearId(body.materia_id);
    if (materiaId === null) {
      return { datos, error: "La materia indicada no es v\xE1lida." };
    }
    datos.materia_id = materiaId;
  } else if (!parcial) {
    return { datos, error: "La materia es obligatoria." };
  }
  if (parcial && Object.keys(datos).length === 0) {
    return { datos, error: "Hay que enviar al menos un campo para actualizar." };
  }
  return { datos, error: null };
};
var validarPuntaje = (valor) => {
  const puntaje = parsearEntero(valor);
  return puntaje !== null && puntaje >= 0 ? puntaje : null;
};
var obtenerCursos = async (req, res) => {
  const filtros = {};
  if (req.query.anio_lectivo !== void 0) {
    const anioLectivo = parsearEntero(req.query.anio_lectivo);
    if (anioLectivo === null) {
      res.status(400).json({ error: "El filtro anio_lectivo no es v\xE1lido." });
      return;
    }
    filtros.anio_lectivo = anioLectivo;
  }
  if (req.query.materia_id !== void 0) {
    const materiaId = parsearId(req.query.materia_id);
    if (materiaId === null) {
      res.status(400).json({ error: "El filtro materia_id no es v\xE1lido." });
      return;
    }
    filtros.materia_id = materiaId;
  }
  if (req.query.mine === "true") {
    filtros.docente_id = req.userId;
  }
  try {
    const cursos = await courseService.obtenerTodos(filtros);
    res.status(200).json(cursos);
  } catch (error) {
    console.error("Error al obtener los cursos:", error);
    res.status(500).json({ error: "Error interno al obtener los cursos." });
  }
};
var obtenerCurso = async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "El ID del curso no es v\xE1lido." });
    return;
  }
  try {
    const curso = await courseService.obtenerPorId(id);
    if (!curso) {
      res.status(404).json({ error: CURSO_NO_ENCONTRADO.mensaje });
      return;
    }
    res.status(200).json(curso);
  } catch (error) {
    console.error("Error al obtener el curso:", error);
    res.status(500).json({ error: "Error interno al obtener el curso." });
  }
};
var crearCurso = async (req, res) => {
  const { datos, error } = validarDatosCurso(req.body ?? {}, false);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  try {
    const curso = await courseService.crear(datos);
    res.status(201).json(curso);
  } catch (err) {
    if (responderError(res, err, {
      P2002: CURSO_DUPLICADO,
      P2003: { status: 400, mensaje: "La materia indicada no existe." }
    })) {
      return;
    }
    console.error("Error al crear el curso:", err);
    res.status(500).json({ error: "Error interno al crear el curso." });
  }
};
var actualizarCurso = async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "El ID del curso no es v\xE1lido." });
    return;
  }
  const { datos, error } = validarDatosCurso(req.body ?? {}, true);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  try {
    const curso = await courseService.actualizar(id, datos);
    res.status(200).json(curso);
  } catch (err) {
    if (responderError(res, err, {
      P2025: CURSO_NO_ENCONTRADO,
      P2002: CURSO_DUPLICADO,
      P2003: { status: 400, mensaje: "La materia indicada no existe." }
    })) {
      return;
    }
    console.error("Error al actualizar el curso:", err);
    res.status(500).json({ error: "Error interno al actualizar el curso." });
  }
};
var eliminarCurso = async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "El ID del curso no es v\xE1lido." });
    return;
  }
  try {
    await courseService.eliminar(id);
    res.status(200).json({ message: "Curso eliminado correctamente." });
  } catch (err) {
    if (responderError(res, err, {
      P2025: CURSO_NO_ENCONTRADO,
      P2003: {
        status: 409,
        mensaje: "No se puede eliminar el curso porque tiene docentes, libros, alumnos o trivias asociados."
      }
    })) {
      return;
    }
    console.error("Error al eliminar el curso:", err);
    res.status(500).json({ error: "Error interno al eliminar el curso." });
  }
};
var asignarDocente = async (req, res) => {
  const id = parsearId(req.params.id);
  const usuarioId = parsearId(req.body?.usuario_id);
  if (!id || !usuarioId) {
    res.status(400).json({ error: "El ID del curso o del docente no es v\xE1lido." });
    return;
  }
  try {
    await courseService.asignarDocente(id, usuarioId);
    res.status(201).json({ message: "Docente asignado correctamente." });
  } catch (err) {
    if (responderError(res, err, {
      P2002: { status: 409, mensaje: "El docente ya est\xE1 asignado a este curso." },
      P2003: CURSO_NO_ENCONTRADO
    })) {
      return;
    }
    console.error("Error al asignar el docente:", err);
    res.status(500).json({ error: "Error interno al asignar el docente." });
  }
};
var quitarDocente = async (req, res) => {
  const id = parsearId(req.params.id);
  const usuarioId = parsearId(req.params.userId);
  if (!id || !usuarioId) {
    res.status(400).json({ error: "El ID del curso o del docente no es v\xE1lido." });
    return;
  }
  try {
    await courseService.quitarDocente(id, usuarioId);
    res.status(200).json({ message: "Docente quitado del curso correctamente." });
  } catch (err) {
    if (responderError(res, err, {
      P2025: { status: 404, mensaje: "El docente no est\xE1 asignado a este curso." }
    })) {
      return;
    }
    console.error("Error al quitar el docente:", err);
    res.status(500).json({ error: "Error interno al quitar el docente." });
  }
};
var obtenerLibrosDelCurso = async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "El ID del curso no es v\xE1lido." });
    return;
  }
  try {
    const libros = await courseService.obtenerLibros(id);
    res.status(200).json(libros);
  } catch (err) {
    if (responderError(res, err)) return;
    console.error("Error al obtener los libros del curso:", err);
    res.status(500).json({ error: "Error interno al obtener los libros del curso." });
  }
};
var asignarLibro = async (req, res) => {
  const id = parsearId(req.params.id);
  const libroId = parsearId(req.body?.libro_id);
  if (!id || !libroId) {
    res.status(400).json({ error: "El ID del curso o del libro no es v\xE1lido." });
    return;
  }
  const puntaje = validarPuntaje(req.body?.puntaje);
  if (puntaje === null) {
    res.status(400).json({ error: "El puntaje debe ser un n\xFAmero entero mayor o igual a 0." });
    return;
  }
  try {
    const asignacion = await courseService.asignarLibro(id, libroId, puntaje, req.userId);
    res.status(201).json(asignacion);
  } catch (err) {
    if (responderError(res, err, {
      P2002: { status: 409, mensaje: "El libro ya est\xE1 asignado a este curso." },
      P2003: { status: 404, mensaje: "El curso o el libro no existen." }
    })) {
      return;
    }
    console.error("Error al asignar el libro:", err);
    res.status(500).json({ error: "Error interno al asignar el libro." });
  }
};
var actualizarPuntajeLibro = async (req, res) => {
  const id = parsearId(req.params.id);
  const libroId = parsearId(req.params.bookId);
  if (!id || !libroId) {
    res.status(400).json({ error: "El ID del curso o del libro no es v\xE1lido." });
    return;
  }
  const puntaje = validarPuntaje(req.body?.puntaje);
  if (puntaje === null) {
    res.status(400).json({ error: "El puntaje debe ser un n\xFAmero entero mayor o igual a 0." });
    return;
  }
  try {
    const asignacion = await courseService.actualizarPuntajeLibro(id, libroId, puntaje, req.userId);
    res.status(200).json(asignacion);
  } catch (err) {
    if (responderError(res, err, {
      P2025: { status: 404, mensaje: "El libro no est\xE1 asignado a este curso." }
    })) {
      return;
    }
    console.error("Error al actualizar el puntaje:", err);
    res.status(500).json({ error: "Error interno al actualizar el puntaje." });
  }
};
var quitarLibro = async (req, res) => {
  const id = parsearId(req.params.id);
  const libroId = parsearId(req.params.bookId);
  if (!id || !libroId) {
    res.status(400).json({ error: "El ID del curso o del libro no es v\xE1lido." });
    return;
  }
  try {
    await courseService.quitarLibro(id, libroId, req.userId);
    res.status(200).json({ message: "Libro quitado del curso correctamente." });
  } catch (err) {
    if (responderError(res, err, {
      P2025: { status: 404, mensaje: "El libro no est\xE1 asignado a este curso." }
    })) {
      return;
    }
    console.error("Error al quitar el libro:", err);
    res.status(500).json({ error: "Error interno al quitar el libro." });
  }
};

// src/routes/course.routes.ts
var router5 = Router5();
router5.get("/", verifyToken, obtenerCursos);
router5.get("/:id", verifyToken, obtenerCurso);
router5.post("/", verifyToken, requireAdmin, crearCurso);
router5.put("/:id", verifyToken, requireAdmin, actualizarCurso);
router5.delete("/:id", verifyToken, requireAdmin, eliminarCurso);
router5.post("/:id/teachers", verifyToken, requireAdmin, asignarDocente);
router5.delete("/:id/teachers/:userId", verifyToken, requireAdmin, quitarDocente);
router5.get("/:id/books", verifyToken, obtenerLibrosDelCurso);
router5.post("/:id/books", verifyToken, asignarLibro);
router5.put("/:id/books/:bookId", verifyToken, actualizarPuntajeLibro);
router5.delete("/:id/books/:bookId", verifyToken, quitarLibro);
var course_routes_default = router5;

// src/routes/favorite.routes.ts
import { Router as Router6 } from "express";

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

// src/routes/favorite.routes.ts
var router6 = Router6();
router6.post("/", verifyToken, favorite_controller_default.create);
router6.get("/", verifyToken, favorite_controller_default.getByUser);
router6.get("/statuses", verifyToken, favorite_controller_default.getReadingStatuses);
router6.patch("/status", verifyToken, favorite_controller_default.updateReadingStatus);
router6.delete("/", verifyToken, favorite_controller_default.delete);
router6.get("/all", verifyToken, favorite_controller_default.getAll);
var favorite_routes_default = router6;

// src/routes/feed.routes.ts
import { Router as Router7 } from "express";

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
var router7 = Router7();
router7.get("/", verifyToken, obtenerFeed);
router7.delete("/", verifyToken, limpiarFeed);
var feed_routes_default = router7;

// src/routes/forum.routes.ts
import { Router as Router8 } from "express";

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

// src/modules/moderation/config/get-gemini-key.ts
var getGeminiKey = async () => {
  try {
    const config = await prisma.configuracion_sistema.findUnique({
      where: { clave: "gemini_api_key" }
    });
    if (config?.valor?.trim()) {
      return config.valor.trim();
    }
  } catch (error) {
  }
  return process.env.GEMINI_API_KEY?.trim() || null;
};

// src/modules/moderation/providers/fallback.provider.ts
var OFFENSIVE_TERMS = [
  "pelotudo",
  "boludo",
  "mierda",
  "puto",
  "hdp",
  "forro",
  "concha",
  "idiota",
  "estupido",
  "tarado",
  "imbecil",
  "puta",
  "garca",
  "cagon",
  "malparido",
  "forra",
  "pelotuda",
  "boluda",
  "basura",
  "maldito",
  "perra",
  "porqueria",
  "asqueroso",
  "inutil"
];
var FallbackModeratorProvider = class {
  async moderate(text, _contextDescription) {
    const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const found = OFFENSIVE_TERMS.find((term) => normalized.includes(term));
    if (found) {
      return {
        isAppropriate: false,
        reason: "Lenguaje inapropiado o potencialmente ofensivo detectado",
        category: "toxicidad_local"
      };
    }
    return { isAppropriate: true };
  }
};

// src/modules/moderation/providers/gemini.provider.ts
var GeminiModeratorProvider = class {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  async moderate(text, contextDescription) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    const contextInfo = contextDescription ? `Contexto del espacio y conversaci\xF3n previa:
${contextDescription}

` : "";
    const prompt = `Actua como moderador estricto para una plataforma escolar de lectura (alumnos de secundaria).
${contextInfo}Analiza el "Texto a analizar" considerando el contexto anterior. Determina si es apropiado o si contiene insultos, acoso, odio, discriminacion o amenazas hacia otros participantes.
IMPORTANTE: Eval\xFAa exclusivamente el "Texto a analizar". El contexto sirve \xFAnicamente para comprender el sentido, intencionalidad o referencias del mensaje.
Responde UNICAMENTE en formato JSON con la siguiente estructura:
{
  "isAppropriate": boolean,
  "reason": "motivo breve en espa\xF1ol si no es apropiado, o vacio si es apropiado",
  "category": "insulto|acoso|discriminacion|odio|ninguna"
}

Texto a analizar:
"${text}"`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
      })
    });
    if (!res.ok) {
      throw new Error(`Gemini API HTTP Error: ${res.status}`);
    }
    const data = await res.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      throw new Error("Invalid response structure from Gemini API");
    }
    const parsed = JSON.parse(rawContent);
    return {
      isAppropriate: Boolean(parsed.isAppropriate),
      reason: parsed.reason || void 0,
      category: parsed.category || void 0
    };
  }
};

// src/modules/moderation/services/moderate-text.service.ts
var moderateText = async (text, contextDescription) => {
  if (!text || !text.trim()) {
    return { isAppropriate: true };
  }
  const fallback = new FallbackModeratorProvider();
  const localResult = await fallback.moderate(text, contextDescription);
  if (!localResult.isAppropriate) {
    return localResult;
  }
  const apiKey = await getGeminiKey();
  if (apiKey) {
    try {
      const gemini = new GeminiModeratorProvider(apiKey);
      return await gemini.moderate(text, contextDescription);
    } catch (error) {
      console.warn("\u26A0\uFE0F Error en Gemini API, derivando a revisi\xF3n manual (Fail-Closed):", error);
      throw error;
    }
  }
  throw new Error("Servicio de IA de moderaci\xF3n no disponible. Contenido retenido para revisi\xF3n manual.");
};

// src/modules/moderation/repositories/save-incident.repository.ts
var saveIncident = async (dto) => {
  const incident = await prisma.incidencia_moderacion.create({
    data: {
      usuario_id: dto.usuario_id,
      contexto: dto.contexto,
      contenido_bloqueado: dto.contenido_bloqueado,
      motivo: dto.motivo,
      categoria: dto.categoria
    },
    select: { incidencia_id: true }
  });
  return incident.incidencia_id;
};

// src/modules/moderation/repositories/get-forum-context.repository.ts
var getForumContext = async (foroId) => {
  if (!foroId || isNaN(foroId)) return null;
  try {
    const foro = await prisma.foro.findUnique({
      where: { foro_id: foroId },
      select: {
        titulo: true,
        descripcion: true,
        comentario_foro: {
          take: 5,
          orderBy: { fecha: "desc" },
          select: {
            contenido: true,
            usuario: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });
    if (!foro) return null;
    let context = `Foro: "${foro.titulo}". Descripci\xF3n: "${foro.descripcion || "Sin descripci\xF3n"}"`;
    if (foro.comentario_foro && foro.comentario_foro.length > 0) {
      const recentComments = [...foro.comentario_foro].reverse();
      const formattedComments = recentComments.map((c) => `- ${c.usuario?.nombre || "Usuario"}: "${c.contenido}"`).join("\n");
      context += `
\xDAltimos comentarios en el debate:
${formattedComments}`;
    }
    return context;
  } catch {
    return null;
  }
};

// src/modules/moderation/helpers/resolve-context.ts
var resolveContext = async (req, context) => {
  if (context === "comentario_foro") {
    const rawForoId = req.params?.id || req.params?.foroId || req.body?.foro_id;
    const foroId = Number(rawForoId);
    if (foroId && !isNaN(foroId)) {
      const forumContext = await getForumContext(foroId);
      if (forumContext) return forumContext;
    }
  }
  return void 0;
};

// src/modules/moderation/middleware/moderate-content.ts
var moderateContent = (fields, context) => {
  return async (req, res, next) => {
    const textsToInspect = fields.map((field) => req.body?.[field]).filter((val) => typeof val === "string" && val.trim().length > 0);
    if (textsToInspect.length === 0) {
      return next();
    }
    const combinedText = textsToInspect.join("\n");
    try {
      const contextDescription = await resolveContext(req, context);
      const result = await moderateText(combinedText, contextDescription);
      if (!result.isAppropriate) {
        await saveIncident({
          usuario_id: req.userId,
          contexto: context,
          contenido_bloqueado: combinedText,
          motivo: result.reason || "Incumplimiento de normas de convivencia escolar",
          categoria: result.category
        }).catch((err) => console.error("Error al registrar incidencia:", err));
        return res.status(400).json({
          ok: false,
          error: "CONTENIDO_BLOQUEADO",
          mensaje: "Tu mensaje no cumple con las pautas de convivencia escolar. Por favor, reformulalo respetuosamente.",
          motivo: result.reason
        });
      }
      return next();
    } catch (error) {
      console.error("Error en middleware de moderaci\xF3n:", error);
      await saveIncident({
        usuario_id: req.userId,
        contexto: context,
        contenido_bloqueado: combinedText,
        motivo: "La revisi\xF3n autom\xE1tica no pudo completarse. Contenido retenido para revisi\xF3n manual.",
        categoria: "revision_manual"
      }).catch((err) => console.error("Error al registrar incidencia:", err));
      return res.status(202).json({
        ok: false,
        error: "EN_REVISION",
        mensaje: "Tu mensaje qued\xF3 en revisi\xF3n por un responsable antes de publicarse. Gracias por tu paciencia."
      });
    }
  };
};

// src/routes/forum.routes.ts
var router8 = Router8();
router8.post("/", moderateContent(["titulo", "descripcion"], "foro"), crearForo);
router8.get("/", obtenerForos);
router8.get("/:id", obtenerForo);
router8.put("/:id", moderateContent(["titulo", "descripcion"], "foro"), actualizarForo);
router8.delete("/:id", eliminarForo);
router8.get("/:id/comentarios", obtenerForoConComentarios);
router8.post("/:id/comentarios", moderateContent(["contenido"], "comentario_foro"), crearComentario);
var forum_routes_default = router8;

// src/routes/list.routes.ts
import { Router as Router9 } from "express";

// src/models/lista.model.ts
var ListaModel = class {
  // ====================================================
  // CREAR LISTA
  // ====================================================
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
        tipo: nuevaLista.tipo ?? "",
        libros: []
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        "Error en ListaModel.crearLista:",
        message
      );
      throw new Error("No se pudo crear la lista.");
    }
  }
  // ====================================================
  // OBTENER TODAS LAS LISTAS
  // ====================================================
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
      return listas.map((lista) => ({
        lista_id: lista.lista_id,
        nombre: lista.nombre,
        descripcion: lista.descripcion ?? "",
        tipo: lista.tipo ?? "",
        // Obtener todos los libros de cada lista
        // con su explicación independiente
        libros: lista.lista_libro.map((relacion) => ({
          ...relacion.libro,
          explicacion: relacion.explicacion ?? ""
        }))
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        "Error en ListaModel.obtenerTodas:",
        message
      );
      throw new Error("No se pudieron obtener las listas.");
    }
  }
  // ====================================================
  // OBTENER LISTA POR ID
  // ====================================================
  async obtenerPorId(listaId) {
    try {
      const lista = await prisma.lista.findUnique({
        where: {
          lista_id: listaId
        },
        include: {
          lista_libro: {
            include: {
              libro: true
            }
          }
        }
      });
      if (!lista) {
        return null;
      }
      return {
        lista_id: lista.lista_id,
        nombre: lista.nombre,
        descripcion: lista.descripcion ?? "",
        tipo: lista.tipo ?? "",
        libros: lista.lista_libro.map((relacion) => ({
          ...relacion.libro,
          explicacion: relacion.explicacion ?? ""
        }))
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `Error en ListaModel.obtenerPorId (${listaId}):`,
        message
      );
      throw new Error("No se pudo obtener la lista.");
    }
  }
  // ====================================================
  // ACTUALIZAR LISTA
  // ====================================================
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
        where: {
          lista_id: listaId
        },
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
        throw new Error(
          `Lista con ID ${listaId} no encontrada.`
        );
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        "Error en ListaModel.actualizarLista:",
        message
      );
      throw error;
    }
  }
  // ====================================================
  // ELIMINAR LISTA
  // ====================================================
  async eliminarLista(listaId) {
    try {
      await prisma.lista.delete({
        where: {
          lista_id: listaId
        }
      });
      return true;
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error(
          `Lista con ID ${listaId} no encontrada.`
        );
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        "Error en ListaModel.eliminarLista:",
        message
      );
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
  // =====================================================
  // CREAR LISTA O RECOMENDACIÓN
  // =====================================================
  async crear(req, res) {
    try {
      const {
        nombre,
        descripcion,
        tipo,
        libroId,
        bookId,
        books,
        bookIds,
        libros
      } = req.body;
      const usuarioId = req.userId ?? req.body.usuarioId;
      if (typeof nombre !== "string" || !nombre.trim() || typeof tipo !== "string" || !tipo.trim()) {
        return res.status(400).json({
          error: "Faltan campos obligatorios (nombre, tipo)."
        });
      }
      if (descripcion !== void 0 && descripcion !== null && typeof descripcion !== "string") {
        return res.status(400).json({
          error: "La descripci\xF3n debe ser un texto."
        });
      }
      const descripcionFinal = descripcion ?? "";
      let librosRecibidos = [];
      if (libros !== void 0) {
        if (!Array.isArray(libros)) {
          return res.status(400).json({
            error: "El campo libros debe ser un arreglo."
          });
        }
        librosRecibidos = libros.map((item) => ({
          libroId: Number(item?.libroId ?? item?.bookId),
          explicacion: typeof item?.explicacion === "string" ? item.explicacion.trim() : ""
        }));
      } else if (Array.isArray(bookIds)) {
        librosRecibidos = bookIds.map((id, index) => ({
          libroId: Number(id),
          explicacion: index === 0 ? descripcionFinal.trim() : ""
        }));
      } else if (Array.isArray(books)) {
        librosRecibidos = books.map((item, index) => ({
          libroId: Number(
            item?.libroId ?? item?.bookId ?? item?.libro_id ?? item?.id ?? item
          ),
          explicacion: typeof item?.explicacion === "string" ? item.explicacion.trim() : index === 0 ? descripcionFinal.trim() : ""
        }));
      } else if (libroId != null || bookId != null) {
        librosRecibidos = [{
          libroId: Number(libroId ?? bookId),
          explicacion: descripcionFinal.trim()
        }];
      }
      if (tipo === "RECOMENDACION" && (librosRecibidos.length < 1 || librosRecibidos.length > 2)) {
        return res.status(400).json({
          error: "Deb\xE9s recomendar uno o dos libros."
        });
      }
      if (librosRecibidos.some(
        (item) => !Number.isSafeInteger(item.libroId) || item.libroId <= 0
      )) {
        return res.status(400).json({
          error: "Uno de los libros tiene un ID inv\xE1lido."
        });
      }
      const ids = librosRecibidos.map(
        (item) => item.libroId
      );
      if (new Set(ids).size !== ids.length) {
        return res.status(400).json({
          error: "No pod\xE9s recomendar el mismo libro dos veces."
        });
      }
      if (tipo === "RECOMENDACION" && libros !== void 0 && librosRecibidos.some(
        (item) => !item.explicacion
      )) {
        return res.status(400).json({
          error: "Cada libro debe tener su explicaci\xF3n."
        });
      }
      const usuarioIdNumerico = usuarioId == null ? null : Number(usuarioId);
      if (usuarioIdNumerico !== null && (!Number.isSafeInteger(usuarioIdNumerico) || usuarioIdNumerico <= 0)) {
        return res.status(400).json({
          error: "El ID del usuario es inv\xE1lido."
        });
      }
      const resultado = await prisma.$transaction(
        async (tx) => {
          const librosExistentes = await tx.libro.findMany({
            where: {
              libro_id: {
                in: ids
              }
            }
          });
          if (librosExistentes.length !== ids.length) {
            throw new Error("LIBROS_NO_ENCONTRADOS");
          }
          const nuevaLista = await tx.lista.create({
            data: {
              nombre: nombre.trim(),
              descripcion: descripcionFinal,
              tipo: tipo.trim()
            }
          });
          if (librosRecibidos.length > 0) {
            await tx.lista_libro.createMany({
              data: librosRecibidos.map((item) => ({
                lista_id: nuevaLista.lista_id,
                libro_id: item.libroId,
                explicacion: item.explicacion
              }))
            });
          }
          const librosConExplicacion = librosRecibidos.map((item) => ({
            ...librosExistentes.find(
              (libro) => libro.libro_id === item.libroId
            ),
            explicacion: item.explicacion
          }));
          return {
            nuevaLista,
            librosConExplicacion
          };
        }
      );
      try {
        await prisma.actividad_feed.create({
          data: {
            usuario_id: usuarioIdNumerico,
            tipo: "AVISO",
            titulo: tipo === "RECOMENDACION" ? "Public\xF3 una recomendaci\xF3n de libros" : `Cre\xF3 una nueva lista: "${nombre.trim()}"`,
            descripcion: descripcionFinal || `Nueva lista de tipo ${tipo}`,
            entidad_id: resultado.nuevaLista.lista_id
          }
        });
      } catch (feedError) {
        console.error(
          "No se pudo registrar la actividad en el feed:",
          feedError
        );
      }
      return res.status(201).json({
        message: "Lista creada correctamente.",
        lista: resultado.nuevaLista,
        // Compatibilidad con el frontend anterior
        libro: resultado.librosConExplicacion[0] ?? null,
        // Nuevo formato
        libros: resultado.librosConExplicacion
      });
    } catch (error) {
      if (error instanceof Error && error.message === "LIBROS_NO_ENCONTRADOS") {
        return res.status(400).json({
          error: "Uno o m\xE1s libros no existen en el cat\xE1logo."
        });
      }
      console.error("Error creando lista:", error);
      return res.status(500).json({
        error: "Error interno al crear la lista."
      });
    }
  }
  // =====================================================
  // OBTENER TODAS LAS LISTAS
  // =====================================================
  async obtenerTodas(req, res) {
    try {
      const listas = await listService.obtenerTodas();
      return res.status(200).json(listas);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error obteniendo listas:", message);
      return res.status(500).json({
        error: "Error interno al obtener listas."
      });
    }
  }
  // =====================================================
  // OBTENER LISTA POR ID
  // =====================================================
  async obtenerPorId(req, res) {
    try {
      const id = Number(req.params.id);
      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          error: "ID inv\xE1lido."
        });
      }
      const lista = await listService.obtenerPorId(id);
      if (!lista) {
        return res.status(404).json({
          error: "Lista no encontrada."
        });
      }
      return res.status(200).json(lista);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        "Error obteniendo lista por ID:",
        message
      );
      return res.status(500).json({
        error: "Error interno."
      });
    }
  }
  // =====================================================
  // ACTUALIZAR LISTA
  // =====================================================
  async actualizar(req, res) {
    try {
      const id = Number(req.params.id);
      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          error: "ID inv\xE1lido."
        });
      }
      const { nombre, descripcion, tipo } = req.body;
      await listService.actualizarLista(
        id,
        nombre,
        descripcion,
        tipo
      );
      return res.status(200).json({
        message: "Lista actualizada."
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error actualizando lista:", message);
      return res.status(500).json({
        error: "Error interno al actualizar."
      });
    }
  }
  // =====================================================
  // ELIMINAR LISTA
  // =====================================================
  async eliminar(req, res) {
    try {
      const id = Number(req.params.id);
      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          error: "ID inv\xE1lido."
        });
      }
      await listService.eliminarLista(id);
      return res.status(200).json({
        message: "Lista eliminada."
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error eliminando lista:", message);
      return res.status(500).json({
        error: "Error interno al eliminar."
      });
    }
  }
};
var list_controller_default = new ListaController();

// src/routes/list.routes.ts
var router9 = Router9();
router9.get("/", list_controller_default.obtenerTodas);
router9.get("/:id", list_controller_default.obtenerPorId);
router9.post("/", list_controller_default.crear);
router9.put("/:id", list_controller_default.actualizar);
router9.delete("/:id", list_controller_default.eliminar);
var list_routes_default = router9;

// src/routes/medal.routes.ts
import { Router as Router10 } from "express";

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
var obtenerCatalogoInsignias = async (req, res) => {
  try {
    const usuario_id = parseInt(String(req.params.usuario_id));
    if (isNaN(usuario_id)) {
      return res.status(400).json({ mensaje: "ID de usuario inv\xE1lido" });
    }
    const catalogo = await medalModel.obtenerCatalogoConEstado(usuario_id);
    res.json(catalogo);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\u274C Error al obtener el cat\xE1logo de insignias:", error);
    res.status(500).json({ mensaje: "Error al obtener el cat\xE1logo de insignias", detalle: message });
  }
};

// src/routes/medal.routes.ts
var router10 = Router10();
router10.get("/catalog/:usuario_id", obtenerCatalogoInsignias);
router10.get("/:usuario_id", obtenerMedallasUsuario);
var medal_routes_default = router10;

// src/routes/metaLectura.routes.ts
import { Router as Router11 } from "express";

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
var router11 = Router11();
router11.post("/", verifyToken, metaLectura_controller_default.crear);
router11.get("/", verifyToken, metaLectura_controller_default.obtenerTodas);
router11.get("/usuario/:usuarioId", verifyToken, metaLectura_controller_default.obtenerMisMetas);
router11.put("/:id", verifyToken, metaLectura_controller_default.actualizar);
router11.delete("/:id", verifyToken, metaLectura_controller_default.eliminar);
var metaLectura_routes_default = router11;

// src/modules/moderation/routes/moderation.routes.ts
import { Router as Router12 } from "express";

// src/modules/moderation/config/save-gemini-key.ts
var saveGeminiKey = async (apiKey) => {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error("API key cannot be empty");
  }
  await prisma.configuracion_sistema.upsert({
    where: { clave: "gemini_api_key" },
    update: { valor: trimmedKey, actualizado: /* @__PURE__ */ new Date() },
    create: {
      clave: "gemini_api_key",
      valor: trimmedKey,
      descripcion: "Google Gemini API Key para moderaci\xF3n de contenido"
    }
  });
};

// src/modules/moderation/repositories/get-incidents.repository.ts
var getIncidents = async (limit = 50) => {
  return prisma.incidencia_moderacion.findMany({
    take: limit,
    orderBy: { fecha: "desc" },
    include: {
      usuario: {
        select: {
          usuario_id: true,
          nombre: true,
          email: true
        }
      }
    }
  });
};

// src/modules/moderation/repositories/update-incident-state.repository.ts
var updateIncidentState = async (incidenciaId, decision, revisorId) => {
  return prisma.incidencia_moderacion.update({
    where: { incidencia_id: incidenciaId },
    data: {
      estado: decision,
      revisado_por: revisorId ?? void 0,
      fecha_revision: /* @__PURE__ */ new Date()
    }
  });
};

// src/modules/moderation/routes/moderation.routes.ts
var router12 = Router12();
var requireAdmin2 = (req, res, next) => {
  const role = Number(req.userRole);
  if (role === 1 || role === 3) return next();
  return res.status(403).json({ error: "Acceso denegado. Permisos insuficientes." });
};
router12.get("/config", verifyToken, requireAdmin2, async (_req, res) => {
  const key = await getGeminiKey();
  const masked = key ? `${key.slice(0, 6)}...${key.slice(-4)}` : null;
  res.json({ configured: Boolean(key), maskedKey: masked });
});
router12.post("/config", verifyToken, requireAdmin2, async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== "string") {
    return res.status(400).json({ error: "La API key de Gemini es requerida" });
  }
  await saveGeminiKey(apiKey);
  res.json({ ok: true, mensaje: "API key de Gemini configurada exitosamente" });
});
router12.get("/incidencias", verifyToken, requireAdmin2, async (_req, res) => {
  const incidencias = await getIncidents(50);
  res.json(incidencias);
});
router12.patch("/incidencias/:id", verifyToken, requireAdmin2, async (req, res) => {
  const incidenciaId = Number(req.params.id);
  const { decision } = req.body;
  if (!Number.isInteger(incidenciaId)) {
    return res.status(400).json({ error: "ID de incidencia inv\xE1lido" });
  }
  if (decision !== "aceptada" && decision !== "rechazada") {
    return res.status(400).json({ error: "decision debe ser 'aceptada' o 'rechazada'" });
  }
  try {
    const incidencia = await updateIncidentState(incidenciaId, decision, req.userId);
    return res.json({ ok: true, incidencia });
  } catch {
    return res.status(404).json({ error: "Incidencia no encontrada" });
  }
});
var moderation_routes_default = router12;

// src/routes/readingList.routes.ts
import { Router as Router13 } from "express";
var router13 = Router13();
router13.post("/", list_controller_default.crear);
router13.get("/", list_controller_default.obtenerTodas);
router13.get("/docente/:docente_id", list_controller_default.obtenerTodas);
router13.put("/:lista_id/:docente_id", list_controller_default.actualizar);
router13.delete("/:lista_id/:docente_id", list_controller_default.eliminar);
var readingList_routes_default = router13;

// src/routes/review.routes.ts
import { Router as Router14 } from "express";

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
    const duplicadoReciente = await prisma.opinion.findFirst({
      where: {
        usuario_id: data.usuario_id,
        libro_id: data.libro_id
      },
      orderBy: { fecha: "desc" },
      include: {
        usuario: { select: { nombre: true } }
      }
    });
    if (duplicadoReciente) {
      const ahora = Date.now();
      const fechaCreacion = new Date(duplicadoReciente.fecha ?? 0).getTime();
      const sesentaSegundos = 60 * 1e3;
      if (ahora - fechaCreacion < sesentaSegundos && duplicadoReciente.comentario === comentarioLimpio) {
        return {
          opinion_id: duplicadoReciente.opinion_id,
          usuario_id: duplicadoReciente.usuario_id,
          usuario_nombre: duplicadoReciente.usuario?.nombre ?? "",
          libro_id: duplicadoReciente.libro_id,
          calificacion: duplicadoReciente.calificacion,
          comentario: duplicadoReciente.comentario ?? "",
          fecha: duplicadoReciente.fecha ?? /* @__PURE__ */ new Date()
        };
      }
    }
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

// src/services/opinion-content.service.ts
var MIN_COMENTARIO = 10;
var MIN_LETRAS = 4;
var CON_VOCALES = /[aeiouáéíóúüñ]/;
var LETRAS = /[a-záéíóúüñ]/g;
var tienePocasLetras = (texto) => (texto.toLowerCase().match(LETRAS) ?? []).length < MIN_LETRAS;
var esAtaqueTeclado = (texto) => {
  const limpio = texto.toLowerCase().replace(/[^a-záéíóúüñ0-9]/g, "");
  return limpio.length >= 3 && !CON_VOCALES.test(limpio);
};
var esRepetitivo = (texto) => {
  const limpio = texto.toLowerCase().replace(/\s/g, "");
  if (limpio.length < 4) return false;
  if (/([a-záéíóúüñ])\1{2,}/.test(limpio)) return true;
  if (new Set(limpio).size <= 2) return true;
  for (let largo = 1; largo <= 3; largo++) {
    if (limpio.length % largo !== 0) continue;
    const bloque = limpio.slice(0, largo);
    if (limpio === bloque.repeat(limpio.length / largo)) return true;
  }
  return false;
};
var validarComentarioOpinion = (comentario) => {
  if (typeof comentario !== "string" || comentario.trim().length === 0) {
    return { valido: false, error: "Escrib\xED un comentario para publicar tu rese\xF1a." };
  }
  const texto = comentario.trim();
  if (texto.length < MIN_COMENTARIO) {
    return {
      valido: false,
      error: `Tu rese\xF1a es muy corta. Cont\xE1 un poco m\xE1s (m\xEDnimo ${MIN_COMENTARIO} caracteres).`
    };
  }
  if (tienePocasLetras(texto)) {
    return {
      valido: false,
      error: "Tu rese\xF1a debe tener al menos una oraci\xF3n escrita."
    };
  }
  if (esAtaqueTeclado(texto)) {
    return {
      valido: false,
      error: "Tu rese\xF1a no parece un texto v\xE1lido. Revisala antes de publicar."
    };
  }
  if (esRepetitivo(texto)) {
    return {
      valido: false,
      error: "Tu rese\xF1a repite caracteres sin sentido. Escrib\xED un comentario real."
    };
  }
  return { valido: true };
};

// src/controllers/review.controller.ts
import { TipoRol as TipoRol4 } from "@prisma/client";
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
      const validacion = validarComentarioOpinion(comentario);
      if (!validacion.valido) {
        return res.status(400).json({ error: validacion.error });
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
      if (userRole !== TipoRol4.ADMINISTRADOR && userId !== existingOpinion.usuario_id) {
        return res.status(403).json({ error: "Not authorized to modify this opinion" });
      }
      if (req.body.comentario !== void 0) {
        const validacion = validarComentarioOpinion(req.body.comentario);
        if (!validacion.valido) {
          return res.status(400).json({ error: validacion.error });
        }
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
      if (userRole !== TipoRol4.ADMINISTRADOR && userId !== existingOpinion.usuario_id) {
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
var router14 = Router14();
router14.get("/", review_controller_default.getAllOpinions.bind(review_controller_default));
router14.get("/:id", review_controller_default.getOpinionById.bind(review_controller_default));
router14.post("/", verifyToken, moderateContent(["comentario"], "opinion"), review_controller_default.createOpinion.bind(review_controller_default));
router14.put("/:id", verifyToken, moderateContent(["comentario"], "opinion"), review_controller_default.updateOpinion.bind(review_controller_default));
router14.delete("/:id", verifyToken, review_controller_default.deleteOpinion.bind(review_controller_default));
router14.get("/book/:bookId", review_controller_default.getOpinionsByLibro.bind(review_controller_default));
router14.get("/libro/:bookId", review_controller_default.getOpinionsByLibro.bind(review_controller_default));
var review_routes_default = router14;

// src/routes/subject.routes.ts
import { Router as Router15 } from "express";

// src/controllers/subject.controller.ts
import { Prisma as Prisma2 } from "@prisma/client";

// src/models/subject.model.ts
var obtenerMateriasDB = async () => {
  return await prisma.materia.findMany({
    orderBy: { nombre: "asc" }
  });
};
var obtenerMateriaPorIdDB = async (materia_id) => {
  return await prisma.materia.findUnique({
    where: { materia_id }
  });
};
var crearMateriaDB = async (nombre) => {
  return await prisma.materia.create({
    data: { nombre }
  });
};
var actualizarMateriaDB = async (materia_id, nombre) => {
  return await prisma.materia.update({
    where: { materia_id },
    data: { nombre }
  });
};
var eliminarMateriaDB = async (materia_id) => {
  await prisma.materia.delete({
    where: { materia_id }
  });
};

// src/services/subject.service.ts
var SubjectService = class {
  async obtenerTodas() {
    return await obtenerMateriasDB();
  }
  async obtenerPorId(materia_id) {
    return await obtenerMateriaPorIdDB(materia_id);
  }
  async crear(nombre) {
    return await crearMateriaDB(nombre.trim());
  }
  async actualizar(materia_id, nombre) {
    return await actualizarMateriaDB(materia_id, nombre.trim());
  }
  async eliminar(materia_id) {
    await eliminarMateriaDB(materia_id);
  }
};
var subjectService = new SubjectService();

// src/controllers/subject.controller.ts
var parsearId2 = (valor) => {
  const id = parseInt(String(valor), 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};
var validarNombre = (nombre) => {
  if (typeof nombre !== "string" || nombre.trim().length === 0) {
    return "El nombre de la materia es obligatorio.";
  }
  if (nombre.trim().length > 100) {
    return "El nombre de la materia no puede superar los 100 caracteres.";
  }
  return null;
};
var obtenerMaterias = async (_req, res) => {
  try {
    const materias = await subjectService.obtenerTodas();
    res.status(200).json(materias);
  } catch (error) {
    console.error("Error al obtener las materias:", error);
    res.status(500).json({ error: "Error interno al obtener las materias." });
  }
};
var obtenerMateria = async (req, res) => {
  const id = parsearId2(req.params.id);
  if (!id) {
    res.status(400).json({ error: "El ID de la materia no es v\xE1lido." });
    return;
  }
  try {
    const materia = await subjectService.obtenerPorId(id);
    if (!materia) {
      res.status(404).json({ error: "Materia no encontrada." });
      return;
    }
    res.status(200).json(materia);
  } catch (error) {
    console.error("Error al obtener la materia:", error);
    res.status(500).json({ error: "Error interno al obtener la materia." });
  }
};
var crearMateria = async (req, res) => {
  const errorNombre = validarNombre(req.body?.nombre);
  if (errorNombre) {
    res.status(400).json({ error: errorNombre });
    return;
  }
  try {
    const materia = await subjectService.crear(req.body.nombre);
    res.status(201).json(materia);
  } catch (error) {
    if (error instanceof Prisma2.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ error: "Ya existe una materia con ese nombre." });
      return;
    }
    console.error("Error al crear la materia:", error);
    res.status(500).json({ error: "Error interno al crear la materia." });
  }
};
var actualizarMateria = async (req, res) => {
  const id = parsearId2(req.params.id);
  if (!id) {
    res.status(400).json({ error: "El ID de la materia no es v\xE1lido." });
    return;
  }
  const errorNombre = validarNombre(req.body?.nombre);
  if (errorNombre) {
    res.status(400).json({ error: errorNombre });
    return;
  }
  try {
    const materia = await subjectService.actualizar(id, req.body.nombre);
    res.status(200).json(materia);
  } catch (error) {
    if (error instanceof Prisma2.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({ error: "Materia no encontrada." });
        return;
      }
      if (error.code === "P2002") {
        res.status(409).json({ error: "Ya existe una materia con ese nombre." });
        return;
      }
    }
    console.error("Error al actualizar la materia:", error);
    res.status(500).json({ error: "Error interno al actualizar la materia." });
  }
};
var eliminarMateria = async (req, res) => {
  const id = parsearId2(req.params.id);
  if (!id) {
    res.status(400).json({ error: "El ID de la materia no es v\xE1lido." });
    return;
  }
  try {
    await subjectService.eliminar(id);
    res.status(200).json({ message: "Materia eliminada correctamente." });
  } catch (error) {
    if (error instanceof Prisma2.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({ error: "Materia no encontrada." });
        return;
      }
      if (error.code === "P2003") {
        res.status(409).json({ error: "No se puede eliminar: hay cursos que usan esta materia." });
        return;
      }
    }
    console.error("Error al eliminar la materia:", error);
    res.status(500).json({ error: "Error interno al eliminar la materia." });
  }
};

// src/routes/subject.routes.ts
var router15 = Router15();
router15.get("/", verifyToken, obtenerMaterias);
router15.get("/:id", verifyToken, obtenerMateria);
router15.post("/", verifyToken, requireAdmin, crearMateria);
router15.put("/:id", verifyToken, requireAdmin, actualizarMateria);
router15.delete("/:id", verifyToken, requireAdmin, eliminarMateria);
var subject_routes_default = router15;

// src/routes/trivia.routes.ts
import { Router as Router16 } from "express";

// src/models/trivia.model.ts
var toISODate = (date) => date ? date.toISOString().slice(0, 10) : null;
var normalize = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
var shuffle = (values) => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
var TriviaModel = class {
  mapToQuestion(row) {
    const question = {
      id: row.pregunta_id,
      mode: row.modo,
      format: row.formato,
      question: row.formato === "completar" ? "" : row.consigna,
      deadline: toISODate(row.fecha_limite),
      evaluationId: row.evaluacion_id,
      cursoId: row.curso_id,
      docenteId: row.docente_id
    };
    if (row.formato === "multiple" || row.formato === "truefalse") {
      question.options = row.opciones.map((option) => option.texto);
      question.correctAnswer = row.opciones.findIndex((option) => option.es_correcta === true);
    }
    if (row.formato === "conexion") {
      question.pairs = row.pares.map((pair) => ({
        left: pair.izquierda,
        right: pair.derecha
      }));
    }
    if (row.formato === "completar") {
      question.text = row.consigna;
      question.answers = row.respuestas.map((respuesta) => respuesta.texto);
    }
    return question;
  }
  async getByBook(bookId) {
    try {
      const rows = await prisma.trivia_pregunta.findMany({
        where: { libro_id: bookId },
        include: {
          opciones: { orderBy: { opcion_id: "asc" } },
          pares: { orderBy: { orden: "asc" } },
          respuestas: { orderBy: { orden: "asc" } }
        },
        orderBy: { pregunta_id: "desc" }
      });
      return rows.map(
        (row) => this.mapToQuestion(row)
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error TriviaModel.getByBook:", message);
      throw new Error("Failed to retrieve trivia questions.");
    }
  }
  async create(data, docenteId) {
    const { bookId, evaluationId, cursoId, mode, format, question, deadline, options, correctAnswer, pairs, text, answers } = data;
    const prompt = format === "completar" ? text ?? "" : question ?? "";
    const createData = {
      libro_id: bookId,
      evaluacion_id: evaluationId || null,
      curso_id: cursoId || null,
      docente_id: docenteId,
      modo: mode,
      formato: format,
      consigna: prompt,
      fecha_limite: deadline ? /* @__PURE__ */ new Date(`${deadline}T00:00:00Z`) : null
    };
    if (format === "multiple" || format === "truefalse") {
      createData.opciones = {
        create: (options ?? []).map((optionText, index) => ({
          texto: optionText,
          es_correcta: index === correctAnswer
        }))
      };
    }
    if (format === "conexion") {
      createData.pares = {
        create: (pairs ?? []).map((pair, index) => ({
          orden: index,
          izquierda: pair.left,
          derecha: pair.right
        }))
      };
    }
    if (format === "completar") {
      createData.respuestas = {
        create: (answers ?? []).map((answerText, index) => ({
          orden: index,
          texto: answerText
        }))
      };
    }
    try {
      const newQuestion = await prisma.trivia_pregunta.create({
        data: createData,
        include: {
          opciones: true,
          pares: true,
          respuestas: true
        }
      });
      return this.mapToQuestion(
        newQuestion
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error TriviaModel.create:", message);
      throw error;
    }
  }
  async delete(questionId) {
    try {
      await prisma.trivia_pregunta.delete({
        where: { pregunta_id: questionId }
      });
      return true;
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error(`Trivia question ${questionId} not found.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error TriviaModel.delete:", message);
      throw error;
    }
  }
  async getById(questionId) {
    try {
      const row = await prisma.trivia_pregunta.findUnique({
        where: { pregunta_id: questionId },
        include: {
          opciones: { orderBy: { opcion_id: "asc" } },
          pares: { orderBy: { orden: "asc" } },
          respuestas: { orderBy: { orden: "asc" } }
        }
      });
      if (!row) return null;
      return this.mapToQuestion(
        row
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error TriviaModel.getById:", message);
      throw new Error("Failed to retrieve trivia question.");
    }
  }
  async getByCourse(cursoId) {
    try {
      const rows = await prisma.trivia_pregunta.findMany({
        where: { curso_id: cursoId },
        include: {
          opciones: { orderBy: { opcion_id: "asc" } },
          pares: { orderBy: { orden: "asc" } },
          respuestas: { orderBy: { orden: "asc" } }
        },
        orderBy: { pregunta_id: "desc" }
      });
      return rows.map(
        (row) => this.mapToQuestion(row)
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error TriviaModel.getByCourse:", message);
      throw new Error("Failed to retrieve course trivia questions.");
    }
  }
  async getEvaluationsByCourse(cursoId) {
    try {
      const rows = await prisma.trivia_evaluacion.findMany({
        where: { curso_id: cursoId },
        include: {
          _count: { select: { trivia_pregunta: true } }
        },
        orderBy: { fecha_creacion: "desc" }
      });
      return rows.map((row) => ({
        evaluationId: row.evaluacion_id,
        bookId: row.libro_id,
        cursoId: row.curso_id,
        docenteId: row.docente_id,
        deadline: toISODate(row.fecha_limite),
        createdAt: row.fecha_creacion.toISOString(),
        questionCount: row._count.trivia_pregunta
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error TriviaModel.getEvaluationsByCourse:", message);
      throw new Error("Failed to retrieve course evaluations.");
    }
  }
  async isDocenteDeCurso(userId, cursoId) {
    try {
      const row = await prisma.curso_docente.findUnique({
        where: { curso_id_usuario_id: { curso_id: cursoId, usuario_id: userId } }
      });
      return !!row;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error TriviaModel.isDocenteDeCurso:", message);
      throw error;
    }
  }
  async isInscripto(cursoId, userId) {
    try {
      const row = await prisma.inscripcion.findFirst({
        where: { curso_id: cursoId, usuario_id: userId }
      });
      return !!row;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error TriviaModel.isInscripto:", message);
      throw error;
    }
  }
  async getStudentCourseIds(userId) {
    try {
      const rows = await prisma.inscripcion.findMany({
        where: { usuario_id: userId },
        select: { curso_id: true }
      });
      return rows.map((row) => row.curso_id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error TriviaModel.getStudentCourseIds:", message);
      throw error;
    }
  }
  async getEvaluationCourse(evaluationId) {
    try {
      const row = await prisma.trivia_evaluacion.findUnique({
        where: { evaluacion_id: evaluationId },
        select: { curso_id: true }
      });
      return row ? row.curso_id : void 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error TriviaModel.getEvaluationCourse:", message);
      throw error;
    }
  }
  async getEvaluationsByBook(bookId, courseIds) {
    try {
      const where = { libro_id: bookId };
      if (courseIds) {
        where.OR = [{ curso_id: { in: courseIds } }, { curso_id: null }];
      }
      const rows = await prisma.trivia_evaluacion.findMany({
        where,
        include: {
          _count: { select: { trivia_pregunta: true } }
        },
        orderBy: { fecha_creacion: "desc" }
      });
      return rows.map((row) => ({
        evaluationId: row.evaluacion_id,
        bookId: row.libro_id,
        deadline: toISODate(row.fecha_limite),
        createdAt: row.fecha_creacion.toISOString(),
        questionCount: row._count.trivia_pregunta
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error TriviaModel.getEvaluationsByBook:", message);
      throw new Error("Failed to retrieve evaluations.");
    }
  }
  async createEvaluation(bookId, deadline, cursoId, docenteId) {
    try {
      const created = await prisma.trivia_evaluacion.create({
        data: {
          libro_id: bookId,
          curso_id: cursoId || null,
          docente_id: docenteId ?? null,
          fecha_limite: deadline ? /* @__PURE__ */ new Date(`${deadline}T00:00:00Z`) : null
        },
        include: {
          _count: { select: { trivia_pregunta: true } }
        }
      });
      return {
        evaluationId: created.evaluacion_id,
        bookId: created.libro_id,
        cursoId: created.curso_id,
        docenteId: created.docente_id,
        deadline: toISODate(created.fecha_limite),
        createdAt: created.fecha_creacion.toISOString(),
        questionCount: created._count.trivia_pregunta
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error TriviaModel.createEvaluation:", message);
      throw error;
    }
  }
  async getEvaluationById(evaluationId) {
    try {
      const row = await prisma.trivia_evaluacion.findUnique({
        where: { evaluacion_id: evaluationId },
        include: {
          _count: { select: { trivia_pregunta: true } },
          trivia_pregunta: {
            orderBy: { pregunta_id: "asc" },
            include: {
              opciones: { orderBy: { opcion_id: "asc" } },
              pares: { orderBy: { orden: "asc" } },
              respuestas: { orderBy: { orden: "asc" } }
            }
          }
        }
      });
      if (!row) return null;
      return {
        evaluation: {
          evaluationId: row.evaluacion_id,
          bookId: row.libro_id,
          deadline: toISODate(row.fecha_limite),
          createdAt: row.fecha_creacion.toISOString(),
          questionCount: row._count.trivia_pregunta
        },
        questions: row.trivia_pregunta.map(
          (question) => this.mapToQuestion(
            question
          )
        )
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error TriviaModel.getEvaluationById:", message);
      throw new Error("Failed to retrieve evaluation.");
    }
  }
  toPlayQuestion(question) {
    if (question.format === "conexion") {
      return {
        id: question.id,
        mode: question.mode,
        format: question.format,
        question: question.question,
        lefts: (question.pairs ?? []).map((pair) => pair.left),
        rights: shuffle((question.pairs ?? []).map((pair) => pair.right))
      };
    }
    const playQuestion = {
      id: question.id,
      mode: question.mode,
      format: question.format,
      question: question.format === "completar" ? "" : question.question
    };
    if (question.format === "multiple" || question.format === "truefalse") {
      playQuestion.options = question.options ?? [];
    }
    if (question.format === "completar") {
      playQuestion.text = question.text;
      playQuestion.deadline = question.deadline;
      playQuestion.wordBank = shuffle(question.answers ?? []);
    }
    return playQuestion;
  }
  async getTriviaForPlay(bookId, courseIds) {
    try {
      const where = { libro_id: bookId, modo: "trivia" };
      if (courseIds) {
        where.OR = [{ curso_id: { in: courseIds } }, { curso_id: null }];
      }
      const rows = await prisma.trivia_pregunta.findMany({
        where,
        include: {
          opciones: { orderBy: { opcion_id: "asc" } },
          pares: { orderBy: { orden: "asc" } },
          respuestas: { orderBy: { orden: "asc" } }
        },
        orderBy: { pregunta_id: "asc" }
      });
      return rows.map(
        (row) => this.toPlayQuestion(
          this.mapToQuestion(row)
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error TriviaModel.getTriviaForPlay:", message);
      throw new Error("Failed to retrieve playable trivia.");
    }
  }
  async getEvaluationForPlay(evaluationId) {
    try {
      const rows = await prisma.trivia_pregunta.findMany({
        where: { evaluacion_id: evaluationId },
        include: {
          opciones: { orderBy: { opcion_id: "asc" } },
          pares: { orderBy: { orden: "asc" } },
          respuestas: { orderBy: { orden: "asc" } }
        },
        orderBy: { pregunta_id: "asc" }
      });
      return rows.map(
        (row) => this.toPlayQuestion(
          this.mapToQuestion(row)
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error TriviaModel.getEvaluationForPlay:", message);
      throw new Error("Failed to retrieve playable evaluation.");
    }
  }
  async checkAnswers(answers) {
    const ids = answers.map((entry) => entry.questionId);
    const rows = await prisma.trivia_pregunta.findMany({
      where: { pregunta_id: { in: ids } },
      include: {
        opciones: true,
        pares: true,
        respuestas: true
      }
    });
    const byId = new Map(rows.map((row) => [row.pregunta_id, row]));
    const results = answers.map(({ questionId, answer }) => {
      const row = byId.get(questionId);
      if (!row) {
        return { questionId, correct: false, solution: null };
      }
      let correct = false;
      let solution = null;
      if (row.formato === "multiple" || row.formato === "truefalse") {
        const correctIndex = row.opciones.findIndex((opcion) => opcion.es_correcta === true);
        const submittedIndex = answer?.optionIndex;
        if (correctIndex >= 0) {
          solution = { optionIndex: correctIndex };
          correct = typeof submittedIndex === "number" && submittedIndex === correctIndex;
        }
      } else if (row.formato === "conexion") {
        const originalPairs = row.pares.map((par) => ({ left: par.izquierda, right: par.derecha }));
        const submittedPairs = answer?.pairs ?? [];
        solution = { pairs: originalPairs };
        correct = submittedPairs.length === originalPairs.length && originalPairs.every(
          (pair) => submittedPairs.some(
            (submitted) => normalize(submitted.left) === normalize(pair.left) && normalize(submitted.right) === normalize(pair.right)
          )
        );
      } else if (row.formato === "completar") {
        const expected = row.respuestas.map((respuesta) => respuesta.texto);
        const submittedTexts = answer?.texts ?? [];
        solution = { texts: expected };
        correct = submittedTexts.length === expected.length && expected.every((expectedText, index) => normalize(submittedTexts[index] ?? "") === normalize(expectedText));
      }
      return { questionId, correct, solution };
    });
    const total = results.length;
    const correctCount = results.filter((result) => result.correct).length;
    return {
      total,
      correctCount,
      percentage: total > 0 ? Math.round(correctCount * 100 / total) : 0,
      results
    };
  }
  async getAttempt(evaluationId, userId) {
    const row = await prisma.triviaAttempt.findUnique({
      where: { evaluationUserAttempt: { evaluationId, userId } },
      include: { user: { select: { nombre: true, email: true } } }
    });
    if (!row) return null;
    return this.mapAttempt(row);
  }
  async saveAttempt(payload) {
    try {
      const created = await prisma.triviaAttempt.create({
        data: {
          evaluationId: payload.evaluationId,
          userId: payload.userId,
          correctCount: payload.result.correctCount,
          totalQuestions: payload.result.total,
          score: payload.result.percentage,
          answersJson: {
            questions: payload.questions,
            answers: payload.answers,
            result: payload.result
          }
        },
        include: { user: { select: { nombre: true, email: true } } }
      });
      return this.mapAttempt(created);
    } catch (error) {
      if (error?.code === "P2002") {
        throw new Error("This evaluation has already been answered by this user.");
      }
      console.error("Error TriviaModel.saveAttempt:", error);
      throw error;
    }
  }
  async getAttemptsByEvaluation(evaluationId) {
    const rows = await prisma.triviaAttempt.findMany({
      where: { evaluationId },
      include: { user: { select: { nombre: true, email: true } } },
      orderBy: { submittedAt: "asc" }
    });
    return rows.map((row) => this.mapAttempt(row));
  }
  mapAttempt(row) {
    return {
      attemptId: row.attemptId,
      evaluationId: row.evaluationId,
      userId: row.userId,
      studentName: row.user.nombre,
      correctCount: row.correctCount,
      total: row.totalQuestions,
      percentage: row.score,
      submittedAt: row.submittedAt.toISOString(),
      payload: row.answersJson
    };
  }
};
var triviaModel = new TriviaModel();

// src/controllers/trivia.controller.ts
var TriviaController = class {
  async getByBook(req, res) {
    try {
      const bookId = parseInt(String(req.params.bookId), 10);
      if (isNaN(bookId)) {
        return res.status(400).json({ error: "Invalid book ID" });
      }
      const questions = await triviaModel.getByBook(bookId);
      return res.status(200).json(questions);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting trivia by book:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async create(req, res) {
    try {
      const {
        bookId,
        evaluationId,
        cursoId,
        mode,
        format,
        question,
        deadline,
        options,
        correctAnswer,
        pairs,
        text,
        answers
      } = req.body;
      if (!bookId || !mode || !format) {
        return res.status(400).json({ error: "Missing required fields: bookId, mode, format" });
      }
      if (!["trivia", "evaluacion"].includes(mode)) {
        return res.status(400).json({ error: "mode must be trivia or evaluacion" });
      }
      if (!["multiple", "truefalse", "conexion", "completar"].includes(format)) {
        return res.status(400).json({ error: "format must be multiple, truefalse, conexion, or completar" });
      }
      if (format === "multiple" || format === "truefalse") {
        if (!options || !Array.isArray(options) || options.length < 2) {
          return res.status(400).json({ error: "At least 2 options are required for multiple/truefalse" });
        }
        if (correctAnswer === void 0 || correctAnswer < 0 || correctAnswer >= options.length) {
          return res.status(400).json({ error: "correctAnswer must be a valid option index" });
        }
      }
      if (format === "conexion") {
        if (!pairs || !Array.isArray(pairs) || pairs.length < 2) {
          return res.status(400).json({ error: "At least 2 pairs are required for conexion format" });
        }
      }
      if (format === "completar") {
        if (!text || !String(text).trim()) {
          return res.status(400).json({ error: "text is required for completar format" });
        }
        if (!answers || !Array.isArray(answers) || answers.length === 0) {
          return res.status(400).json({ error: "At least 1 answer is required for completar format" });
        }
      }
      const numericCursoId = cursoId != null ? parseInt(String(cursoId), 10) : null;
      if (numericCursoId !== null && isNaN(numericCursoId)) {
        return res.status(400).json({ error: "cursoId must be a valid number" });
      }
      const isAdmin = Number(req.userRole) === 3;
      if (!isAdmin && numericCursoId !== null) {
        if (!req.userId) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const esDocente = await triviaModel.isDocenteDeCurso(req.userId, numericCursoId);
        if (!esDocente) {
          return res.status(403).json({ error: "Solo un docente del curso puede crear preguntas asignadas a \xE9l." });
        }
      }
      const data = {
        bookId,
        evaluationId,
        cursoId: numericCursoId,
        mode,
        format,
        question,
        deadline: deadline || null,
        options: options || [],
        correctAnswer: correctAnswer ?? -1,
        pairs: pairs || [],
        text: text || "",
        answers: answers || []
      };
      const newQuestion = await triviaModel.create(data, req.userId);
      return res.status(201).json(newQuestion);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error creating trivia question:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async delete(req, res) {
    try {
      const questionId = parseInt(String(req.params.questionId), 10);
      if (isNaN(questionId)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }
      if (!req.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const question = await triviaModel.getById(questionId);
      if (!question) {
        return res.status(404).json({ error: `Trivia question ${questionId} not found.` });
      }
      const isAdmin = Number(req.userRole) === 3;
      const isOwner = question.docenteId === req.userId;
      const esDocente = question.cursoId != null ? await triviaModel.isDocenteDeCurso(req.userId, question.cursoId) : false;
      if (!isAdmin && !isOwner && !esDocente) {
        return res.status(403).json({
          error: "No puedes eliminar esta pregunta: solo el docente que la cre\xF3 o el docente del curso."
        });
      }
      await triviaModel.delete(questionId);
      return res.status(204).end();
    } catch (error) {
      if (error.message?.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error deleting trivia question:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async getByCourse(req, res) {
    try {
      const cursoId = parseInt(String(req.params.cursoId), 10);
      if (isNaN(cursoId)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }
      if (!req.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const isAdmin = Number(req.userRole) === 3;
      const esDocente = await triviaModel.isDocenteDeCurso(req.userId, cursoId);
      const esAlumno = await triviaModel.isInscripto(cursoId, req.userId);
      if (!isAdmin && !esDocente && !esAlumno) {
        return res.status(403).json({
          error: "Solo docentes del curso o alumnos inscriptos pueden ver las preguntas del curso."
        });
      }
      const questions = await triviaModel.getByCourse(cursoId);
      return res.status(200).json(questions);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting trivia by course:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async getEvaluationsByCourse(req, res) {
    try {
      const cursoId = parseInt(String(req.params.cursoId), 10);
      if (isNaN(cursoId)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }
      if (!req.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const isAdmin = Number(req.userRole) === 3;
      const esDocente = await triviaModel.isDocenteDeCurso(req.userId, cursoId);
      const esAlumno = await triviaModel.isInscripto(cursoId, req.userId);
      if (!isAdmin && !esDocente && !esAlumno) {
        return res.status(403).json({
          error: "Solo docentes del curso o alumnos inscriptos pueden ver las evaluaciones del curso."
        });
      }
      const evaluations = await triviaModel.getEvaluationsByCourse(cursoId);
      return res.status(200).json(evaluations);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting evaluations by course:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async getEvaluationsByBook(req, res) {
    try {
      const bookId = parseInt(String(req.params.bookId), 10);
      if (isNaN(bookId)) {
        return res.status(400).json({ error: "Invalid book ID" });
      }
      const isStudent = req.userId != null && Number(req.userRole) === 1;
      const courseIds = isStudent ? await triviaModel.getStudentCourseIds(req.userId) : void 0;
      const evaluations = await triviaModel.getEvaluationsByBook(bookId, courseIds);
      return res.status(200).json(evaluations);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting evaluations:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async createEvaluation(req, res) {
    try {
      const { bookId, deadline, cursoId } = req.body;
      if (!bookId) {
        return res.status(400).json({ error: "Missing required field: bookId" });
      }
      const numericCursoId = cursoId != null ? parseInt(String(cursoId), 10) : null;
      if (numericCursoId !== null && isNaN(numericCursoId)) {
        return res.status(400).json({ error: "cursoId must be a valid number" });
      }
      const isAdmin = Number(req.userRole) === 3;
      if (!isAdmin && numericCursoId !== null) {
        if (!req.userId) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const esDocente = await triviaModel.isDocenteDeCurso(req.userId, numericCursoId);
        if (!esDocente) {
          return res.status(403).json({ error: "Solo un docente del curso puede crear evaluaciones asignadas a \xE9l." });
        }
      }
      const newEvaluation = await triviaModel.createEvaluation(bookId, deadline, numericCursoId, req.userId);
      return res.status(201).json(newEvaluation);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error creating evaluation:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async getEvaluationById(req, res) {
    try {
      const evaluationId = parseInt(String(req.params.evaluationId), 10);
      if (isNaN(evaluationId)) {
        return res.status(400).json({ error: "Invalid evaluation ID" });
      }
      const detail = await triviaModel.getEvaluationById(evaluationId);
      if (!detail) {
        return res.status(404).json({ error: "Evaluation not found" });
      }
      return res.status(200).json(detail);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting evaluation by ID:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async getTriviaForPlay(req, res) {
    try {
      const bookId = parseInt(String(req.params.bookId), 10);
      if (isNaN(bookId)) {
        return res.status(400).json({ error: "Invalid book ID" });
      }
      const isStudent = req.userId != null && Number(req.userRole) === 1;
      const courseIds = isStudent ? await triviaModel.getStudentCourseIds(req.userId) : void 0;
      const questions = await triviaModel.getTriviaForPlay(bookId, courseIds);
      return res.status(200).json(questions);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting trivia for play:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async getEvaluationForPlay(req, res) {
    try {
      const evaluationId = parseInt(String(req.params.evaluationId), 10);
      if (isNaN(evaluationId)) {
        return res.status(400).json({ error: "Invalid evaluation ID" });
      }
      if (req.userId != null && Number(req.userRole) === 1) {
        const courseId = await triviaModel.getEvaluationCourse(evaluationId);
        if (courseId === void 0) {
          return res.status(404).json({ error: "Evaluation not found" });
        }
        if (courseId !== null) {
          const studentCourses = await triviaModel.getStudentCourseIds(req.userId);
          if (!studentCourses.includes(courseId)) {
            return res.status(403).json({ error: "Esta evaluaci\xF3n no pertenece a tus cursos." });
          }
        }
      }
      const questions = await triviaModel.getEvaluationForPlay(evaluationId);
      return res.status(200).json(questions);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting evaluation for play:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async checkAnswers(req, res) {
    try {
      const { answers, evaluationId } = req.body;
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ error: "answers array is required" });
      }
      const result = await triviaModel.checkAnswers(answers);
      const evaluationNumber = evaluationId ? parseInt(String(evaluationId), 10) : null;
      if (evaluationNumber && req.userId) {
        if (Number(req.userRole) === 1) {
          const courseId = await triviaModel.getEvaluationCourse(evaluationNumber);
          if (courseId === void 0) {
            return res.status(404).json({ error: "Evaluation not found" });
          }
          if (courseId !== null) {
            const studentCourses = await triviaModel.getStudentCourseIds(req.userId);
            if (!studentCourses.includes(courseId)) {
              return res.status(403).json({ error: "Esta evaluaci\xF3n no pertenece a tus cursos." });
            }
          }
        }
        const existing = await triviaModel.getAttempt(evaluationNumber, req.userId);
        if (existing) {
          return res.status(409).json({
            error: "Esta evaluaci\xF3n ya fue respondida por este alumno.",
            attempt: existing
          });
        }
        const questions = await triviaModel.getEvaluationForPlay(evaluationNumber);
        await triviaModel.saveAttempt({
          evaluationId: evaluationNumber,
          userId: req.userId,
          questions,
          answers,
          result
        });
      }
      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already been answered")) {
        return res.status(409).json({ error: "Esta evaluaci\xF3n ya fue respondida por este alumno." });
      }
      console.error("Error checking trivia answers:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async getAttemptStatus(req, res) {
    try {
      const evaluationId = parseInt(String(req.params.evaluationId), 10);
      if (isNaN(evaluationId)) {
        return res.status(400).json({ error: "Invalid evaluation ID" });
      }
      if (!req.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (Number(req.userRole) === 1) {
        const courseId = await triviaModel.getEvaluationCourse(evaluationId);
        if (courseId === void 0) {
          return res.status(404).json({ error: "Evaluation not found" });
        }
        if (courseId !== null) {
          const studentCourses = await triviaModel.getStudentCourseIds(req.userId);
          if (!studentCourses.includes(courseId)) {
            return res.status(403).json({ error: "Esta evaluaci\xF3n no pertenece a tus cursos." });
          }
        }
      }
      const attempt = await triviaModel.getAttempt(evaluationId, req.userId);
      return res.status(200).json({
        answered: !!attempt,
        attempt: attempt ? {
          attemptId: attempt.attemptId,
          correctCount: attempt.correctCount,
          total: attempt.total,
          percentage: attempt.percentage,
          submittedAt: attempt.submittedAt
        } : null
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting attempted status:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async getAttemptsByEvaluation(req, res) {
    try {
      const evaluationId = parseInt(String(req.params.evaluationId), 10);
      if (isNaN(evaluationId)) {
        return res.status(400).json({ error: "Invalid evaluation ID" });
      }
      const attempts = await triviaModel.getAttemptsByEvaluation(evaluationId);
      return res.status(200).json(attempts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting attempts by evaluation:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};
var trivia_controller_default = new TriviaController();

// src/routes/trivia.routes.ts
var router16 = Router16();
router16.get("/evaluacion/libro/:bookId", trivia_controller_default.getEvaluationsByBook);
router16.get("/evaluacion/curso/:cursoId", verifyToken, trivia_controller_default.getEvaluationsByCourse);
router16.post("/evaluacion", verifyToken, trivia_controller_default.createEvaluation);
router16.get("/evaluacion/:evaluationId", trivia_controller_default.getEvaluationById);
router16.get("/jugar/libro/:bookId", optionalAuth, trivia_controller_default.getTriviaForPlay);
router16.get("/jugar/evaluacion/:evaluationId", optionalAuth, trivia_controller_default.getEvaluationForPlay);
router16.post("/jugar/check", verifyToken, trivia_controller_default.checkAnswers);
router16.get("/jugar/evaluacion/:evaluationId/status", verifyToken, trivia_controller_default.getAttemptStatus);
router16.get("/evaluacion/:evaluationId/attempts", verifyToken, trivia_controller_default.getAttemptsByEvaluation);
router16.get("/libro/:bookId", trivia_controller_default.getByBook);
router16.get("/curso/:cursoId", verifyToken, trivia_controller_default.getByCourse);
router16.post("/", verifyToken, trivia_controller_default.create);
router16.delete("/:questionId", verifyToken, trivia_controller_default.delete);
var trivia_routes_default = router16;

// src/routes/user.routes.ts
import { Router as Router17 } from "express";

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
  async getUsersPaginated(pagination) {
    return await userModel.getUsersPaginated(pagination);
  }
};
var userService = new UserService();

// src/controllers/user.controller.ts
var UserController = class {
  async getAllUsers(req, res) {
    try {
      const pagination = parsePagination(req.query, 5);
      if (pagination) {
        const result = await userService.getUsersPaginated(pagination);
        return res.status(200).json(result);
      }
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
      const rolRaw = newUser.rol ? String(newUser.rol).toUpperCase() : "ALUMNO";
      if (!newUser.nombre || !newUser.email || !newUser.contrasena) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const result = await userService.createUser({
        ...newUser,
        rol: rolRaw
      });
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
var router17 = Router17();
router17.get("/", verifyToken, requireAdmin, user_controller_default.getAllUsers);
router17.get("/:id", verifyToken, user_controller_default.getUserById);
router17.post("/", user_controller_default.createUser);
router17.put("/:id", verifyToken, user_controller_default.updateUser);
router17.delete("/:id", verifyToken, requireAdmin, user_controller_default.deleteUser);
var user_routes_default = router17;

// src/routes/radio.routes.ts
import { Router as Router18 } from "express";

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
    const episodioId = Number(id);
    if (isNaN(episodioId)) {
      return res.status(400).json({ mensaje: "ID de episodio inv\xE1lido" });
    }
    const episodio = await obtenerEpisodioPorIdDB(episodioId);
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
import { TipoRol as TipoRol5 } from "@prisma/client";
var router18 = Router18();
router18.get("/", obtenerTodosEpisodios);
router18.post("/sincronizar", verifyToken, sincronizarProgramas);
router18.get("/:id", obtenerEpisodioPorId);
router18.post("/", verifyToken, requireRole(TipoRol5.DOCENTE, TipoRol5.ADMINISTRADOR), crearEpisodio);
router18.delete("/:id", verifyToken, requireRole(TipoRol5.DOCENTE, TipoRol5.ADMINISTRADOR), eliminarEpisodio);
var radio_routes_default = router18;

// server.ts
var app = express();
var PORT = process.env.PORT || 3e3;
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
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
app.use("/api/v1/trivia", trivia_routes_default);
app.use("/api/v1/subjects", subject_routes_default);
app.use("/api/v1/courses", course_routes_default);
app.use("/api/v1/moderation", moderation_routes_default);
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
app.use("/api/v1/moderacion", moderation_routes_default);
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

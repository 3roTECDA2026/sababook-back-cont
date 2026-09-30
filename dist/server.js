// server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";

// src/routes/foro.routes.ts
import { Router } from "express";

// src/db/connect/db.ts
import { PrismaClient } from "@prisma/client";
var globalForPrisma = globalThis;
var prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
var testConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("\u2705 Database connection established (Prisma / Supabase)");
    return prisma;
  } catch (error) {
    console.error("\u274C Supabase database connection failed:", error.message);
    throw error;
  }
};

// src/models/foro.model.ts
var crearForoDB = async (titulo, descripcion, creador_id) => {
  const result = await prisma.foro.create({
    data: {
      titulo,
      descripcion,
      creador_id
    },
    select: {
      foro_id: true
    }
  });
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
    creador_nombre: f.usuario?.nombre ?? null
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
    creador_nombre: f.usuario?.nombre ?? null
  };
};
var actualizarForoDB = async (foro_id, titulo, descripcion) => {
  const result = await prisma.foro.update({
    where: { foro_id },
    data: {
      titulo,
      descripcion
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
    comentarios: comentariosFormatted
  };
};

// src/controllers/foro.controller.ts
var crearForo = async (req, res) => {
  try {
    console.log("\u{1F7E1} Datos recibidos desde frontend:", req.body);
    const { titulo, descripcion, creador_id } = req.body;
    const nuevoForo = await crearForoDB(titulo, descripcion, creador_id);
    res.status(201).json({ foro_id: nuevoForo.foro_id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\u274C Error al crear foro:", error);
    res.status(500).json({ mensaje: "Error al crear el foro", detalle: message });
  }
};
var obtenerForos = async (req, res) => {
  try {
    const foros = await obtenerTodosForosDB();
    res.json(foros);
  } catch (error) {
    console.error("\u274C Error al obtener foros:", error);
    res.status(500).json({ mensaje: "Error al obtener los foros" });
  }
};
var obtenerForo = async (req, res) => {
  try {
    const foro_id = parseInt(String(req.params.id));
    const foro = await obtenerForoPorIdDB(foro_id);
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
    const { titulo, descripcion } = req.body;
    const foroActualizado = await actualizarForoDB(parseInt(String(req.params.id)), titulo, descripcion);
    if (!foroActualizado) return res.status(404).json({ mensaje: "Foro no encontrado" });
    res.json({ mensaje: "Foro actualizado correctamente" });
  } catch (error) {
    console.error("\u274C Error al actualizar foro:", error);
    res.status(500).json({ mensaje: "Error al actualizar el foro" });
  }
};
var eliminarForo = async (req, res) => {
  try {
    const foroEliminado = await eliminarForoDB(parseInt(String(req.params.id)));
    if (!foroEliminado) return res.status(404).json({ mensaje: "Foro no encontrado" });
    res.json({ mensaje: "Foro eliminado correctamente" });
  } catch (error) {
    console.error("\u274C Error al eliminar foro:", error);
    res.status(500).json({ mensaje: "Error al eliminar el foro" });
  }
};
var obtenerForoConComentarios = async (req, res) => {
  try {
    const foro_id = parseInt(String(req.params.id));
    const foroConComentarios = await obtenerForoConComentariosDB(foro_id);
    if (!foroConComentarios) return res.status(404).json({ mensaje: "Foro no encontrado" });
    res.json(foroConComentarios);
  } catch (error) {
    console.error("\u274C Error al obtener foro con comentarios:", error);
    res.status(500).json({ mensaje: "Error al obtener foro con comentarios" });
  }
};

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

// src/controllers/comentario.controller.ts
var crearComentario = async (req, res) => {
  try {
    const foro_id = parseInt(String(req.params.id));
    const { usuario_id, contenido } = req.body;
    const nuevoComentario = await insertarComentario(foro_id, usuario_id, contenido);
    await medalModel.verificarYAsignarMedallas(usuario_id);
    const foroConComentarios = await obtenerForoConComentariosDB(foro_id);
    const comentarioCompleto = foroConComentarios?.comentarios.find(
      (c) => c.comentario_id === nuevoComentario.comentario_id
    );
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
    let comentarios;
    if (req.params.foro_id) {
      comentarios = await obtenerComentariosPorForo(parseInt(String(req.params.foro_id)));
    } else {
      comentarios = await obtenerTodosComentarios();
    }
    res.json(comentarios);
  } catch (error) {
    console.error("\u274C Error al obtener comentarios:", error);
    res.status(500).json({ mensaje: "Error al obtener los comentarios" });
  }
};
var obtenerComentario = async (req, res) => {
  try {
    const comentario = await obtenerComentarioPorId(parseInt(String(req.params.id)));
    if (!comentario) return res.status(404).json({ mensaje: "Comentario no encontrado" });
    res.json(comentario);
  } catch (error) {
    console.error("\u274C Error al obtener comentario:", error);
    res.status(500).json({ mensaje: "Error al obtener el comentario" });
  }
};
var actualizarComentario = async (req, res) => {
  try {
    const comentarioActualizado = await actualizarComentarioPorId(parseInt(String(req.params.id)), req.body.contenido);
    if (!comentarioActualizado) return res.status(404).json({ mensaje: "Comentario no encontrado" });
    res.json({ mensaje: "Comentario actualizado correctamente" });
  } catch (error) {
    console.error("\u274C Error al actualizar comentario:", error);
    res.status(500).json({ mensaje: "Error al actualizar el comentario" });
  }
};
var eliminarComentario = async (req, res) => {
  try {
    const comentarioEliminado = await eliminarComentarioPorId(parseInt(String(req.params.id)));
    if (!comentarioEliminado) return res.status(404).json({ mensaje: "Comentario no encontrado" });
    res.json({ mensaje: "Comentario eliminado correctamente" });
  } catch (error) {
    console.error("\u274C Error al eliminar comentario:", error);
    res.status(500).json({ mensaje: "Error al eliminar el comentario" });
  }
};

// src/routes/foro.routes.ts
var router = Router();
router.post("/", crearForo);
router.get("/", obtenerForos);
router.get("/:id", obtenerForo);
router.put("/:id", actualizarForo);
router.delete("/:id", eliminarForo);
router.get("/:id/comentarios", obtenerForoConComentarios);
router.post("/:id/comentarios", crearComentario);
var foro_routes_default = router;

// src/routes/comentario.routes.ts
import { Router as Router2 } from "express";
var router2 = Router2();
router2.post("/", crearComentario);
router2.get("/:foro_id", obtenerComentarios);
router2.get("/:id", obtenerComentario);
router2.put("/:id", actualizarComentario);
router2.delete("/:id", eliminarComentario);
router2.post("/:id/comentarios", crearComentario);
var comentario_routes_default = router2;

// src/routes/user.routes.ts
import { Router as Router3 } from "express";

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

// src/controllers/user.controller.ts
var UserController = class {
  async getAllUsers(req, res) {
    try {
      const users = await userModel.getAllUsers();
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
      const result = await userModel.createUser(newUser);
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
      const result = await userModel.updateUser(userId, updatedUser);
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
      await userModel.deleteUser(userId);
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
      const user = await userModel.getUserById(userId);
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

// src/middleware/auth.middleware.ts
import jwt from "jsonwebtoken";
var verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

// src/routes/user.routes.ts
var router3 = Router3();
var roldAdmin = 3;
router3.get(
  "/",
  /*verifyToken, requireRole(roldAdmin),*/
  user_controller_default.getAllUsers
);
router3.get("/:id", verifyToken, user_controller_default.getUserById);
router3.post("/", user_controller_default.createUser);
router3.put("/:id", verifyToken, user_controller_default.updateUser);
router3.delete("/:id", verifyToken, requireRole(roldAdmin), user_controller_default.deleteUser);
var user_routes_default = router3;

// src/routes/lista.routes.ts
import { Router as Router4 } from "express";

// src/models/lista.model.ts
var ListaModel = class {
  async crearLista(nombre, descripcion, tipo) {
    try {
      const nuevaLista = await prisma.lista.create({
        data: {
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
          lista_id: "asc"
        },
        select: {
          lista_id: true,
          nombre: true,
          descripcion: true,
          tipo: true
        }
      });
      return listas.map((l) => ({
        ...l,
        descripcion: l.descripcion ?? "",
        tipo: l.tipo ?? ""
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
        select: {
          lista_id: true,
          nombre: true,
          descripcion: true,
          tipo: true
        }
      });
      if (!lista) return null;
      return {
        ...lista,
        descripcion: lista.descripcion ?? "",
        tipo: lista.tipo ?? ""
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

// src/controllers/lista.controller.ts
var ListaController = class {
  async crear(req, res) {
    try {
      const { nombre, descripcion, tipo } = req.body;
      if (!nombre || !tipo) {
        return res.status(400).json({ error: "Faltan campos obligatorios (nombre, tipo)." });
      }
      await listaModel.crearLista(nombre, descripcion, tipo);
      return res.status(201).json({ message: "Lista creada correctamente." });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error creando lista:", message);
      return res.status(500).json({ error: "Error interno al crear la lista." });
    }
  }
  async obtenerTodas(req, res) {
    try {
      const listas = await listaModel.obtenerTodas();
      return res.status(200).json(listas);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error obteniendo listas:", message);
      return res.status(500).json({ error: "Error interno al obtener listas." });
    }
  }
  async obtenerPorId(req, res) {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inv\xE1lido." });
      }
      const lista = await listaModel.obtenerPorId(id);
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
      const id = parseInt(String(req.params.id));
      const { nombre, descripcion, tipo } = req.body;
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inv\xE1lido." });
      }
      await listaModel.actualizarLista(id, nombre, descripcion, tipo);
      return res.status(200).json({ message: "Lista actualizada." });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error actualizando lista:", message);
      return res.status(500).json({ error: "Error interno al actualizar." });
    }
  }
  async eliminar(req, res) {
    try {
      const id = parseInt(String(req.params.id));
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inv\xE1lido." });
      }
      await listaModel.eliminarLista(id);
      return res.status(200).json({ message: "Lista eliminada." });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error eliminando lista:", message);
      return res.status(500).json({ error: "Error interno al eliminar." });
    }
  }
};
var lista_controller_default = new ListaController();

// src/routes/lista.routes.ts
var router4 = Router4();
router4.get("/", lista_controller_default.obtenerTodas);
router4.get("/:id", lista_controller_default.obtenerPorId);
router4.post("/", lista_controller_default.crear);
router4.put("/:id", lista_controller_default.actualizar);
router4.delete("/:id", lista_controller_default.eliminar);
var lista_routes_default = router4;

// src/routes/listaLectura.routes.ts
import { Router as Router5 } from "express";

// src/models/listaLectura.model.ts
var ListaLecturaModel = class {
  async crearListaLectura(lista_id, docente_id, descripcion, nivel) {
    try {
      const nueva = await prisma.lista_lectura.create({
        data: {
          lista_id,
          docente_id,
          descripcion,
          nivel
        }
      });
      return {
        lista_id: nueva.lista_id,
        docente_id: nueva.docente_id,
        descripcion: nueva.descripcion ?? "",
        nivel: nueva.nivel ?? "",
        fecha_creacion: nueva.fecha_creacion ?? /* @__PURE__ */ new Date()
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error en ListaLecturaModel.crearListaLectura:", message);
      throw new Error("No se pudo crear la lista de lectura.");
    }
  }
  async obtenerTodas() {
    try {
      const listas = await prisma.lista_lectura.findMany({
        include: {
          lista: {
            select: {
              nombre: true
            }
          }
        },
        orderBy: {
          fecha_creacion: "desc"
        }
      });
      return listas.map((item) => ({
        lista_id: item.lista_id,
        docente_id: item.docente_id,
        nombre_lista: item.lista?.nombre ?? "",
        descripcion: item.descripcion ?? "",
        nivel: item.nivel ?? "",
        fecha_creacion: item.fecha_creacion ?? /* @__PURE__ */ new Date()
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error en ListaLecturaModel.obtenerTodas:", message);
      throw new Error("No se pudieron obtener las listas de lectura.");
    }
  }
  async obtenerPorDocente(docente_id) {
    try {
      const listas = await prisma.lista_lectura.findMany({
        where: { docente_id },
        include: {
          lista: {
            select: {
              nombre: true
            }
          }
        },
        orderBy: {
          fecha_creacion: "desc"
        }
      });
      return listas.map((item) => ({
        lista_id: item.lista_id,
        nombre_lista: item.lista?.nombre ?? "",
        descripcion: item.descripcion ?? "",
        nivel: item.nivel ?? "",
        fecha_creacion: item.fecha_creacion ?? /* @__PURE__ */ new Date()
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error en ListaLecturaModel.obtenerPorDocente (${docente_id}):`, message);
      throw new Error("No se pudieron obtener las listas del docente.");
    }
  }
  async actualizarListaLectura(lista_id, docente_id, descripcion, nivel) {
    try {
      const campos = { descripcion, nivel };
      Object.keys(campos).forEach((key) => {
        if (campos[key] === void 0) delete campos[key];
      });
      if (Object.keys(campos).length === 0) {
        throw new Error("No hay campos para actualizar.");
      }
      const updated = await prisma.lista_lectura.update({
        where: {
          lista_id_docente_id: {
            lista_id,
            docente_id
          }
        },
        data: campos
      });
      return {
        lista_id: updated.lista_id,
        docente_id: updated.docente_id,
        descripcion: updated.descripcion ?? "",
        nivel: updated.nivel ?? "",
        fecha_creacion: updated.fecha_creacion ?? /* @__PURE__ */ new Date()
      };
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error(`No se encontr\xF3 lista_lectura con lista_id ${lista_id} y docente_id ${docente_id}.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error en ListaLecturaModel.actualizarListaLectura:", message);
      throw error;
    }
  }
  async eliminarListaLectura(lista_id, docente_id) {
    try {
      await prisma.lista_lectura.delete({
        where: {
          lista_id_docente_id: {
            lista_id,
            docente_id
          }
        }
      });
      return true;
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error(`No se encontr\xF3 lista_lectura con lista_id ${lista_id} y docente_id ${docente_id}.`);
      }
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error en ListaLecturaModel.eliminarListaLectura:", message);
      throw new Error("No se pudo eliminar la lista de lectura.");
    }
  }
};
var listaLecturaModel = new ListaLecturaModel();

// src/controllers/listaLectura.controller.ts
var ListaLecturaController = class {
  async crear(req, res) {
    try {
      const { lista_id, docente_id, descripcion, nivel } = req.body;
      if (!lista_id || !docente_id || !descripcion || !nivel) {
        return res.status(400).json({ error: "Faltan campos obligatorios." });
      }
      const nuevaLista = await listaLecturaModel.crearListaLectura(lista_id, docente_id, descripcion, nivel);
      res.status(201).json(nuevaLista);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error al crear lista de lectura:", message);
      res.status(500).json({ error: "No se pudo crear la lista de lectura." });
    }
  }
  async obtenerTodas(req, res) {
    try {
      const listas = await listaLecturaModel.obtenerTodas();
      res.status(200).json(listas);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error al obtener listas de lectura:", message);
      res.status(500).json({ error: "Error al obtener las listas de lectura." });
    }
  }
  async obtenerPorDocente(req, res) {
    try {
      const docente_id = parseInt(String(req.params.docente_id));
      if (!req.params.docente_id || isNaN(docente_id)) {
        return res.status(400).json({ error: "ID de docente es requerido." });
      }
      const listas = await listaLecturaModel.obtenerPorDocente(docente_id);
      res.status(200).json(listas);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error al obtener listas por docente:", message);
      res.status(500).json({ error: "No se pudieron obtener las listas." });
    }
  }
  async actualizar(req, res) {
    try {
      const lista_id = parseInt(String(req.params.lista_id));
      const docente_id = parseInt(String(req.params.docente_id));
      const { descripcion, nivel } = req.body;
      if (!descripcion && !nivel) {
        return res.status(400).json({ error: "No se proporcionaron datos para actualizar." });
      }
      const actualizada = await listaLecturaModel.actualizarListaLectura(lista_id, docente_id, descripcion, nivel);
      res.status(200).json(actualizada);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("No se encontr\xF3 lista_lectura")) {
        return res.status(404).json({ error: message });
      }
      console.error("Error al actualizar lista de lectura:", message);
      res.status(500).json({ error: "No se pudo actualizar la lista de lectura." });
    }
  }
  async eliminar(req, res) {
    try {
      const lista_id = parseInt(String(req.params.lista_id));
      const docente_id = parseInt(String(req.params.docente_id));
      await listaLecturaModel.eliminarListaLectura(lista_id, docente_id);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("No se encontr\xF3 lista_lectura")) {
        return res.status(404).json({ error: message });
      }
      console.error("Error al eliminar lista de lectura:", message);
      res.status(500).json({ error: "No se pudo eliminar la lista de lectura." });
    }
  }
};
var listaLectura_controller_default = new ListaLecturaController();

// src/routes/listaLectura.routes.ts
var router5 = Router5();
router5.post("/", listaLectura_controller_default.crear);
router5.get("/", listaLectura_controller_default.obtenerTodas);
router5.get("/docente/:docente_id", listaLectura_controller_default.obtenerPorDocente);
router5.put("/:lista_id/:docente_id", listaLectura_controller_default.actualizar);
router5.delete("/:lista_id/:docente_id", listaLectura_controller_default.eliminar);
var listaLectura_routes_default = router5;

// src/routes/auth.routes.ts
import { Router as Router6 } from "express";

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

// src/controllers/auth.controller.ts
import bcrypt2 from "bcrypt";
import jwt2 from "jsonwebtoken";
var AuthController = class {
  async login(req, res) {
    const { email, contrasena } = req.body;
    if (!email || !contrasena) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    try {
      const user = await auth_model_default.getUserByEmail(req.body.email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const passwordMatch = await bcrypt2.compare(contrasena, user.contrasena);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const payload = {
        usuario_id: user.usuario_id,
        nombre: user.nombre,
        rol_id: user.rol_id
      };
      const token = jwt2.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
      return res.status(200).json({
        message: "Inicio de sesi\xF3n exitoso.",
        token,
        userId: user.usuario_id,
        rol: user.rol_id
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error during login:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async register(req, res) {
    try {
      const { email } = req.body;
      const existingUser = await auth_model_default.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "El email ya est\xE1 registrado. Por favor, inicia sesi\xF3n o usa otro correo." });
      }
      const newUser = await userModel.createUser(req.body);
      return res.status(201).json({
        message: "Usuario registrado con \xE9xito.",
        usuario: {
          usuario_id: newUser.usuario_id,
          email: newUser.email
        }
      });
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
  }
};
var auth_controller_default = new AuthController();

// src/routes/auth.routes.ts
var router6 = Router6();
router6.post("/login", auth_controller_default.login);
router6.post("/register", auth_controller_default.register);
var auth_routes_default = router6;

// src/routes/book.routes.ts
import { Router as Router7 } from "express";

// src/models/book.model.ts
var crearLibro = async (datos) => {
  try {
    return await prisma.libro.create({
      data: datos
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
  return await prisma.libro.findUnique({
    where: { libro_id: id }
  });
};
var buscarLibros = async ({
  query,
  genero,
  nivel_educativo
}) => {
  const whereClause = {};
  if (query) {
    whereClause.OR = [
      { titulo: { contains: query, mode: "insensitive" } },
      { autor: { contains: query, mode: "insensitive" } }
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
};
var actualizarLibro = async (id, datos) => {
  await prisma.libro.update({
    where: { libro_id: id },
    data: datos
  });
};
var eliminarLibro = async (id) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.opinion.deleteMany({
        where: { libro_id: id }
      });
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
  await prisma.libro.update({
    where: { libro_id: id },
    data: { activo: false }
  });
};

// src/controllers/book.controller.ts
var BookController = class {
  // NUEVA FUNCIÓN: CREAR LIBRO (Maneja el POST 404)
  async crear(req, res) {
    try {
      const nuevoLibro = await crearLibro(req.body);
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
      const libros = await obtenerTodos();
      res.json(libros);
    } catch (error) {
      console.error("Error al obtener cat\xE1logo:", error);
      res.status(500).json({ mensaje: "Error al obtener libros" });
    }
  }
  async verDetalle(req, res) {
    const id = parseInt(String(req.params.id));
    try {
      const libro = await obtenerPorId(id);
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
      const libros = await buscarLibros(req.query);
      res.json(libros);
    } catch (error) {
      console.error("Error al buscar libros:", error);
      res.status(500).json({ mensaje: "Error al buscar libros" });
    }
  }
  async actualizar(req, res) {
    const id = parseInt(String(req.params.id));
    try {
      await actualizarLibro(id, req.body);
      res.json({ mensaje: "Libro actualizado correctamente" });
    } catch (error) {
      console.error("Error al actualizar:", error);
      res.status(500).json({ mensaje: "Error al actualizar libro" });
    }
  }
  // FUNCIÓN MEJORADA: ELIMINAR LIBRO (Maneja el DELETE 500)
  // Nota: Esta lógica debería ir en el modelo, pero la implementamos aquí para arreglar el error de FK.
  async eliminar(req, res) {
    const id = parseInt(String(req.params.id));
    try {
      const eliminado = await eliminarLibro(id);
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
    const id = parseInt(String(req.params.id));
    try {
      await eliminacionLogica(id);
      res.json({ mensaje: "Libro marcado como inactivo" });
    } catch (error) {
      console.error("Error al marcar como inactivo:", error);
      res.status(500).json({ mensaje: "Error al marcar libro como inactivo" });
    }
  }
};
var book_controller_default = new BookController();

// src/routes/book.routes.ts
var router7 = Router7();
router7.post("/", book_controller_default.crear);
router7.get("/", book_controller_default.obtenerCatalogo);
router7.get("/buscar", book_controller_default.buscar);
router7.get("/:id", book_controller_default.verDetalle);
router7.put("/:id", book_controller_default.actualizar);
router7.delete("/:id", book_controller_default.eliminar);
router7.patch("/inactivar/:id", book_controller_default.eliminacionLogica);
var book_routes_default = router7;

// src/routes/opinion.routes.ts
import { Router as Router8 } from "express";

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

// src/controllers/opinion.controller.ts
import leoProfanity from "leo-profanity";
leoProfanity.loadDictionary("en");
leoProfanity.loadDictionary("es");
leoProfanity.add(["mierda", "pelotudo", "boludo", "Estupido"]);
var OpinionController = class {
  async getAllOpinions(req, res) {
    try {
      const opinions = await opinionModel.getAllOpinions();
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
      const opinion = await opinionModel.getOpinionById(opinionId);
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
      const comentarioLimpio = leoProfanity.clean(comentario);
      const newOpinion = await opinionModel.createOpinion({
        usuario_id,
        libro_id,
        calificacion,
        comentario: comentarioLimpio
      });
      console.log(newOpinion);
      await medalModel.verificarYAsignarMedallas(usuario_id);
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
      const existingOpinion = await opinionModel.getOpinionById(opinionId);
      if (!existingOpinion) {
        return res.status(404).json({ error: "Opinion not found" });
      }
      const userId = req.userId;
      const userRole = req.userRole;
      if (userRole !== 3 && userId !== existingOpinion.usuario_id) {
        return res.status(403).json({ error: "Not authorized to modify this opinion" });
      }
      const updatedFields = req.body;
      if (updatedFields.comentario) {
        updatedFields.comentario = leoProfanity.clean(updatedFields.comentario);
      }
      const updatedOpinion = await opinionModel.updateOpinion(opinionId, updatedFields);
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
      const existingOpinion = await opinionModel.getOpinionById(opinionId);
      if (!existingOpinion) {
        return res.status(404).json({ error: "Opinion not found" });
      }
      const userId = req.userId;
      const userRole = req.userRole;
      if (userRole !== 3 && userId !== existingOpinion.usuario_id) {
        return res.status(403).json({ error: "Not authorized to delete this opinion" });
      }
      await opinionModel.deleteOpinion(opinionId);
      return res.status(204).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error deleting opinion:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  async getOpinionsByLibro(req, res) {
    try {
      const libroId = parseInt(String(req.params.libro_id), 10);
      if (isNaN(libroId)) {
        return res.status(400).json({ error: "Invalid libro ID" });
      }
      const sqlOpinions = await opinionModel.getOpinionsByLibro(libroId);
      return res.status(200).json(sqlOpinions);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting opinions by libro:", message);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};
var opinion_controller_default = new OpinionController();

// src/routes/opinion.routes.ts
var router8 = Router8();
router8.get("/", opinion_controller_default.getAllOpinions);
router8.get("/:id", opinion_controller_default.getOpinionById);
router8.post("/", verifyToken, opinion_controller_default.createOpinion);
router8.put("/:id", verifyToken, opinion_controller_default.updateOpinion);
router8.delete("/:id", verifyToken, opinion_controller_default.deleteOpinion);
router8.get("/libro/:libro_id", opinion_controller_default.getOpinionsByLibro);
var opinion_routes_default = router8;

// src/routes/favorite.routes.ts
import { Router as Router9 } from "express";

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
      calificacion_promedio: Number(f.libro.calificacion_promedio ?? 0)
    }));
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

// src/controllers/favorite.controller.ts
var FavoriteController = class {
  //  GET: Obtener todos los favoritos (opcional, para testing o admin)
  async getAll(req, res) {
    try {
      const favorites = await favoriteModel.getAllFavorites();
      res.status(200).json(favorites);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting favorites:", message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  //  POST: Crear un nuevo favorito
  async create(req, res) {
    try {
      const usuario_id = req.userId;
      const { libro_id } = req.body;
      if (!usuario_id || !libro_id) {
        return res.status(400).json({ error: "Missing required fields: usuario_id or libro_id" });
      }
      const newFavorite = await favoriteModel.createFavorite({ usuario_id, libro_id });
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
      const favorites = await favoriteModel.getFavoritesByUser(usuario_id);
      res.status(200).json(favorites);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Error getting user favorites:", message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  // DELETE: Eliminar un favorito
  async delete(req, res) {
    try {
      const usuario_id = req.userId;
      const libro_id = parseInt(String(req.body.libro_id));
      if (!usuario_id || isNaN(libro_id)) {
        return res.status(400).json({ error: "Invalid or missing IDs" });
      }
      const result = await favoriteModel.deleteFavorite(usuario_id, libro_id);
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
var router9 = Router9();
router9.post("/", verifyToken, favorite_controller_default.create);
router9.get("/", verifyToken, favorite_controller_default.getByUser);
router9.delete("/", verifyToken, favorite_controller_default.delete);
router9.get("/all", verifyToken, favorite_controller_default.getAll);
var favorite_routes_default = router9;

// src/routes/medal.routes.ts
import { Router as Router10 } from "express";

// src/controllers/medal.controller.ts
var obtenerMedallasUsuario = async (req, res) => {
  try {
    const usuario_id = parseInt(String(req.params.usuario_id));
    if (isNaN(usuario_id)) {
      return res.status(400).json({ mensaje: "ID de usuario inv\xE1lido" });
    }
    const medallas = await medalModel.obtenerMedallasPorUsuario(usuario_id);
    res.json(medallas);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\u274C Error al obtener medallas del usuario:", error);
    res.status(500).json({ mensaje: "Error al obtener las medallas", detalle: message });
  }
};

// src/routes/medal.routes.ts
var router10 = Router10();
router10.get("/:usuario_id", obtenerMedallasUsuario);
var medal_routes_default = router10;

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
app.use("/api/v1/foro", foro_routes_default);
app.use("/api/v1/comentario", comentario_routes_default);
app.use("/api/v1/user", user_routes_default);
app.use("/api/v1/listas", lista_routes_default);
app.use("/api/v1/listas-lectura", listaLectura_routes_default);
app.use("/api/v1/auth", auth_routes_default);
app.use("/api/v1/libros", book_routes_default);
app.use("/api/v1/opinion", opinion_routes_default);
app.use("/api/v1/favorites", favorite_routes_default);
app.use("/api/v1/medal", medal_routes_default);
app.get("/", (req, res) => {
  res.status(200).send("Hello World!\n");
});
testConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error("Error al conectar a la base de datos:", error);
  process.exit(1);
});

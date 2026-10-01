# 🛡️ Guía de Aprendizaje: Arquitectura e Implementación de Seguridad Backend

Bienvenido a la guía de seguridad de **`sababook-back-cont`**. El objetivo de este documento es explicar de forma clara los conceptos fundamentales de seguridad aplicados en este servidor.

---

## 📚 1. ¿Por qué usamos JWT y no Sesiones en Servidor?

Cuando un usuario inicia sesión en una aplicación web, el servidor necesita recordar quién es en las siguientes peticiones. Existen dos enfoques principales:

### A. Sesiones Tradicionales (Stateful / Cookies)
- **Cómo funciona:** El servidor genera un ID de sesión ramdom y lo guarda en su memoria o en una base de datos. Al navegador le envía una Cookie con ese ID.
- **Limitación:** Si escalás el servidor a 3 instancias distintas, necesitás sincronizar esa memoria entre los 3 servidores (usando algo como Redis) o el usuario perderá la sesión si la siguiente petición cae en otro servidor.

### B. Tokens Firmados JWT (Stateless / Bearer Token) — *Nuestro Enfoque*
- **Cómo funciona:** El servidor valida el usuario y genera un string encriptado con una firma matemática (JWT) que contiene los datos del usuario (`usuario_id`, `rol_id`). Se lo envía al cliente y el cliente lo guarda.
- **Ventaja:** En cada petición, el cliente envía el token en la cabecera `Authorization: Bearer <token>`. Cualquier servidor puede verificar la firma usando una clave secreta (`JWT_SECRET`) sin consultar la base de datos ni guardar estado.

---

## 🏛️ 2. Arquitectura de Control de Acceso (RBAC)

Para evitar que cualquier usuario autenticado ejecute acciones administrativas, el servidor utiliza **Control de Acceso Basado en Roles (RBAC)** mediante dos middlewares en Express:

```text
[Cliente HTTP] ──(Request con Bearer Token)──> [verifyToken] ──> [requireRole(1)] ──> [Controlador Admin]
```

### 1️⃣ Verificación de Firma (`verifyToken`)
Comprueba que el token sea auténtico, no haya expirado y extrae los datos del usuario:
```typescript
// src/middleware/auth.middleware.ts
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
    req.userId = decoded.usuario_id ?? decoded.id;
    req.userRole = decoded.rol_id ?? 1;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

### 2️⃣ Autorización por Rol (`requireRole`)
Verifica si el rol extraído en `verifyToken` coincide con el rol necesario para ejecutar la ruta:
```typescript
export const requireRole = (requiredRole: number) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (Number(req.userRole) !== requiredRole) {
      return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });
    }
    next();
  };
};
```

---

## 🛠️ 3. Aplicación Práctica en Endpoints

Para proteger un endpoint sensible (por ejemplo, guardar la API Key de Moderación Gemini), encadenamos ambos middlewares en la definición de la ruta:

```typescript
import { Router } from 'express';
import { verifyToken, requireRole } from '@/middleware/auth.middleware';
import moderationController from '@/controllers/moderation.controller';

const router = Router();

// Endpoint que requiere token válido Y rol de Administrador (ID 1)
router.post('/moderacion/config', verifyToken, requireRole(1), moderationController.saveConfig);
```

---

## 🧠 4. Lecciones para Nuevos Desarrolladores

1. **Nunca guardar contraseñas en texto plano:** Siempre usar `bcrypt` con Salt.
2. **El Payload del JWT NO es secreto:** Cualquiera puede decodificarlo en Base64. Nunca guardes tarjetas de crédito o contraseñas dentro del JWT; solo guarda identificadores (`usuario_id`, `rol_id`).
3. **Firmas y `JWT_SECRET`:** La seguridad de todo el sistema depende de la clave `JWT_SECRET` almacenada en el `.env`. Si alguien la descubre, puede falsificar tokens de administrador.

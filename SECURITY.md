# 🛡️ Guía de Seguridad y Diagnóstico Backend (sababook-back-cont)

Este documento describe el análisis de seguridad realizado sobre el repositorio backend de **Sababook** (`sababook-back-cont`), detallando su arquitectura de autenticación con **JWT**, el control de acceso por **roles** y la política de mantenimiento de dependencias.

---

## 1. 📌 Postura de Seguridad y Diagnóstico de Arquitectura

A diferencia de otros prototipos, **`sababook-back-cont`** cuenta con un esquema funcional de autenticación mediante tokens JWT y control de acceso basado en roles (RBAC).

*   **Estado de Autenticación:** 
    *   La emisión de tokens se realiza en el endpoint `POST /api/v1/auth/login` ([src/controllers/auth.controller.ts](file:///home/jmro/Documents/Institute_Projects_2026/repos/sababook-back-cont/src/controllers/auth.controller.ts#L8-L40)). 
    *   Los tokens expirados o firmados con una clave distinta son rechazados en el middleware `verifyToken` ([src/middleware/auth.middleware.ts](file:///home/jmro/Documents/Institute_Projects_2026/repos/sababook-back-cont/src/middleware/auth.middleware.ts#L18-L36)).
*   **Control de Acceso por Roles (RBAC):**
    *   Implementado mediante el middleware `requireRole(roleId)` ([src/middleware/auth.middleware.ts](file:///home/jmro/Documents/Institute_Projects_2026/repos/sababook-back-cont/src/middleware/auth.middleware.ts#L43-L50)).
    *   Se utiliza para proteger rutas administrativas y de configuración sensible (como el guardado de la API Key de moderación Gemini en `/api/v1/moderacion/config`).
*   **Hash de Contraseñas:** Las credenciales se almacenan cifradas con `bcrypt` (10 salt rounds).

---

## 2. 🔑 Implementación de JWT (JSON Web Token)

### ¿Por qué JWT y no sesiones tradicionales (Cookies)?
1. **Stateless (Sin estado en servidor):** El token incluye la identidad del usuario (`usuario_id`, `rol_id`) en su payload firmado, evitando consultas a la base de datos para verificar la sesión en cada request.
2. **Compatibilidad con Frontend Desacoplado:** Permite al cliente React (Vite) enviar el token en el header HTTP estándar `Authorization: Bearer <token>` sin depender de cookies de terceros o restricciones de dominio cross-origin (CORS).

### Flujo de Verificación
```typescript
// Extraído de src/middleware/auth.middleware.ts
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

---

## 3. 🛡️ Implicaciones para el Desarrollo

*   **Variables de Entorno Mandatorias:** Se debe definir la variable `JWT_SECRET` en el archivo `.env`. Jamás usar el valor por defecto en entornos de producción.
*   **Encadenamiento de Middlewares:** Todas las rutas protegidas deben invocar primero a `verifyToken` y, si requieren restricción de permisos, a `requireRole(ID)`:
    ```typescript
    router.post('/moderacion/config', verifyToken, requireRole(1), moderationController.saveConfig);
    ```

---

## 4. 📦 Política de Mantenimiento de Dependencias

*   **Auditoría periódica:** Ejecutar `npm audit` ante cualquier actualización de paquetes.
*   **Instalación reproducible:** Utilizar `npm ci` en entornos de integración y despliegue para garantizar las versiones exactas registradas en `package-lock.json`.

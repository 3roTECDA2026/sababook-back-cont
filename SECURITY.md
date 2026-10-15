# 🛡️ Análisis de Seguridad del Código Backend (sababook-back-cont)

Este documento vuelca el análisis estático y de arquitectura de seguridad sobre la base de código actual de `sababook-back-cont`.

---

## 1. 🔍 Hallazgos y Estado del Código

### A. Autenticación y Cifrado
- **Controlador de Autenticación:** Se localiza en [src/controllers/auth.controller.ts](file:///home/jmro/Documents/Institute_Projects_2026/repos/sababook-back-cont/src/controllers/auth.controller.ts).
- **Cifrado de Contraseñas:** El registro e inicio de sesión comparan contraseñas utilizando `bcrypt.compare` contra hashes almacenados.
- **Emisión de Token:** Tras la autenticación exitosa, `jwt.sign` emite un token firmado conteniendo `usuario_id`, `nombre` y `rol_id` con expiración de 1 hora.

### B. Protecciones en Middlewares
- **Verificación:** `verifyToken` ([src/middleware/auth.middleware.ts](file:///home/jmro/Documents/Institute_Projects_2026/repos/sababook-back-cont/src/middleware/auth.middleware.ts#L18)) valida la cabecera `Authorization: Bearer <token>` e inyecta `req.userId` y `req.userRole`.
- **Autorización (RBAC):** `requireRole` ([src/middleware/auth.middleware.ts](file:///home/jmro/Documents/Institute_Projects_2026/repos/sababook-back-cont/src/middleware/auth.middleware.ts#L43)) Restringe el paso en rutas administrativas verificando el ID del rol.

---

## 2. ⚠️ Puntos de Atención Detectados

1. **Variables de Entorno (`.env`):** El código depende de `process.env.JWT_SECRET`. Se debe verificar que en producción no use claves por defecto ni cortas.
2. **Exposición de Payloads:** Los datos del token están codificados en Base64; no deben incluirse información sensible en el objeto `payload`.
3. **Mantenimiento de Dependencias:** El proyecto utiliza `bcrypt` y `jsonwebtoken`. Se comprobó el árbol de dependencias mediante `npm audit`.

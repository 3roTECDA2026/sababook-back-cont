# agent.md — sababook-back-cont

Guía para agentes de IA y desarrolladores que trabajan en este repositorio.
Resume cómo está armado el backend, sus convenciones y las reglas que no se pueden romper.

---

## 1. Qué es

API REST de **La Gran Ocasión / Sababook**, plataforma de la Biblioteca Julio Cortázar
(Escuela Nacional "Ernesto Sábato") para fomentar la lectura entre alumnos y docentes.
El frontend vive en otro repositorio (`sababook-front-cont`, React + Vite + MUI).

Funcionalidades principales: catálogo de libros, favoritos y estados de lectura, opiniones,
foros, Café Literario, Radio Sábato, muro de actividad, metas de lectura, medallas,
listas y recomendaciones, cursos y materias, trivia y evaluaciones, panel docente
y moderación de contenido con IA.

## 2. Stack

| Componente | Tecnología |
| --- | --- |
| Runtime | Node.js, módulos ES (`"type": "module"`) |
| Framework | Express 5 |
| Lenguaje | TypeScript 5.4 (`strict: false`) |
| ORM | Prisma 6.19 (`@prisma/client` y `prisma`, misma versión) |
| Base de datos | PostgreSQL 17 en **Supabase** |
| Autenticación | JWT (`jsonwebtoken`, HS256) + `bcrypt` |
| Build | `tsup` (genera `dist/server.js`) |
| Dev | `tsx watch` |

## 3. Comandos

```bash
npm install                 # instala y corre `prisma generate` (postinstall)
npm run dev                 # servidor con recarga en http://localhost:3000
npm run typecheck           # tsc --noEmit — correrlo antes de cada commit
npm run build               # compila a dist/ con tsup
npm start                   # ejecuta dist/server.js (producción)
npx prisma generate         # regenerar el cliente tras cambiar schema.prisma
```

No hay tests automatizados. La verificación mínima es `npm run typecheck` y probar
los endpoints afectados (Postman o `curl`) contra el back local.

## 4. Variables de entorno

Se cargan desde `.env` (ignorado por git). La plantilla es `.env.example`.
**Nunca** commitear valores reales ni pegarlos en issues, PRs o logs.

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto del servidor (por defecto 3000) |
| `JWT_SECRET` | Firma de los tokens |
| `DATABASE_URL` | Conexión de la app vía pooler de Supabase (puerto **6543**, modo transacción) |
| `DIRECT_URL` | Conexión directa/sesión (puerto **5432**). Usar para comandos de migración |
| `SUPABASE_URL`, `SUPABASE_KEY` | Cliente de Supabase |
| `ADMIN_INITIAL_KEY` | Alta inicial de administrador |

## 5. Estructura

```
server.ts                  # Express: CORS, JSON, montaje de rutas en /api/v1, alias legacy
prisma/
  schema.prisma            # modelo de datos (fuente de verdad del cliente)
  migrations/              # una carpeta por migración, cada una con migration.sql
  seed.sql                 # datos de desarrollo (¡TRUNCA tablas! solo bases locales)
src/
  routes/        *.routes.ts       # define endpoints y middlewares
  controllers/   *.controller.ts   # valida entrada, arma la respuesta HTTP
  services/      *.service.ts      # reglas de negocio y permisos
  models/        *.model.ts        # acceso a datos con Prisma
  middleware/    auth.middleware.ts
  db/connect/db.ts                 # instancia única de PrismaClient (`prisma`)
  modules/moderation/              # módulo autocontenido (providers, repositories, etc.)
  utils/pagination.ts
docs/                      # manual y documentación
```

### Capas (MVC)

`route → controller → service → model → prisma`

- **Rutas:** solo declaran el endpoint y los middlewares (`verifyToken`, `requireRole`...).
- **Controllers:** parsean y validan `params`, `query` y `body`; traducen errores a códigos HTTP.
- **Services:** permisos y reglas de negocio. Lanzan `ErrorNegocio(status, mensaje)`
  (definido en `services/course.service.ts`) para errores esperados.
- **Models:** consultas Prisma y mapeo a los tipos que devuelve la API.
- Importar siempre `prisma` desde `src/db/connect/db.ts`; no crear otros `PrismaClient`.

Hay módulos viejos que consultan Prisma directo desde el controller. Para código nuevo,
seguir el patrón en capas de `course` o `teacherPanel`.

## 6. Convenciones de código

- **Idioma:** nombres de dominio, mensajes de error y comentarios en **español**
  (`obtenerCursos`, `'Curso no encontrado.'`). Mantener el idioma del archivo que se edita.
- **Archivos:** `nombre.capa.ts` (`teacherPanel.service.ts`, `course.routes.ts`).
- **Primera línea:** comentario con la ruta del archivo (`// src/models/course.model.ts`).
- **Errores:** responder `{ error: 'mensaje' }` con el status correcto
  (400 entrada inválida, 401 sin autenticación, 403 sin permiso, 404 no existe,
  409 conflicto/duplicado, 500 error interno). Algunos módulos viejos usan `{ mensaje }`:
  respetar el formato del módulo que se edita.
- **IDs:** validar que sean enteros positivos antes de consultar (ver `parsearId` en `course.controller.ts`).
- **Errores de Prisma:** mapear `P2002` → 409, `P2003` → 400/409, `P2025` → 404.
- **Comentarios:** explicar el porqué, no repetir el código.
- **Constantes con nombre** para valores de negocio (ej. `DIAS_ABANDONO_POR_DEFECTO`).

## 7. Autenticación y roles

- El token se manda como `Authorization: Bearer <token>`. Su payload incluye `usuario_id` y `rol`.
- Middlewares en `src/middleware/auth.middleware.ts`:
  - `verifyToken`: exige token; completa `req.userId` y `req.userRole`.
  - `optionalAuth`: si hay token lo lee; si no, sigue sin usuario.
  - `requireRole(TipoRol.DOCENTE, ...)`: valida el rol del token.
  - `requireAdmin`: valida el rol contra la base.
- Usar `AuthRequest` (no `Request`) en controllers que leen `req.userId`.
- El rol es el **enum de Prisma `TipoRol`** (`ADMINISTRADOR | DOCENTE | ALUMNO`).
  - ✅ `req.userRole === TipoRol.ALUMNO`
  - ❌ `Number(req.userRole) === 1` — quedó roto desde la migración de roles a enum
    (`Number('ALUMNO')` es `NaN`). Si se encuentra este patrón, reemplazarlo.
- La identidad sale **siempre del token** (`req.userId`), nunca del body ni de la URL.
- Relaciones docente/alumno/curso: `curso_docente` (docente ↔ curso),
  `inscripcion` (alumno ↔ curso, una por año lectivo), `curso_libro` (libros asignados).

## 8. Base de datos y migraciones ⚠️

La base de **Supabase es compartida por todo el equipo**. Un error acá afecta a todos.

### Reglas

1. **Nunca** correr `prisma migrate dev`, `prisma migrate reset` ni `prisma db push`
   contra Supabase. Si Prisma pide un reset ("Drift detected... All data will be lost"),
   responder **NO**.
2. **Todo cambio en `schema.prisma` lleva su migración** en el mismo PR. Sin migración,
   el cliente pide columnas que no existen y se caen todas las consultas a esa tabla.
3. Las migraciones se escriben **idempotentes**:
   `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`,
   y las claves foráneas dentro de un bloque `DO $$` que verifique `pg_constraint`
   filtrando por `conname` **y** `conrelid = '"tabla"'::regclass`.
4. **No modificar una migración ya aplicada.** Prisma guarda su checksum; para corregir,
   crear una migración nueva de reparación.
5. Cada migración es una **carpeta** `AAAAMMDDHHMMSS_descripcion/` con un `migration.sql`
   adentro (un archivo suelto es ignorado por Prisma).
6. Si `migrate deploy` falla, **no** usar `prisma migrate resolve --applied` sin antes
   aplicar a mano lo que faltó: la marca como aplicada pero no la ejecuta.
7. Al agregar columnas `NOT NULL` con default, pensar qué valor deben tomar las filas
   existentes (puede requerir un `UPDATE` en la misma migración).
8. `prisma/seed.sql` empieza con `TRUNCATE ... CASCADE`: **solo** para bases locales.

### Flujo para un cambio de esquema

```bash
# 1. Editar prisma/schema.prisma
# 2. Crear la carpeta prisma/migrations/<timestamp>_<descripcion>/migration.sql
#    (se puede partir del SQL que sugiere Prisma, en solo lectura):
set -a; source .env; set +a
DATABASE_URL="$DIRECT_URL" npx prisma migrate diff \
  --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --script
# 3. Hacer el SQL idempotente, regenerar el cliente y verificar tipos
npx prisma generate && npm run typecheck
# 4. Después del merge en develop (avisando al equipo), aplicar:
DATABASE_URL="$DIRECT_URL" npx prisma migrate deploy
# 5. Verificar
DATABASE_URL="$DIRECT_URL" npx prisma migrate status   # "Database schema is up to date!"
```

Los comandos de migración usan `DIRECT_URL` porque `prisma migrate` no funciona a través
del pooler en modo transacción (puerto 6543). Si `migrate dev --create-only` modifica
`prisma/migrations/migration_lock.toml`, revertirlo con `git checkout`.

## 9. API

Base: `/api/v1`. Recursos principales:

| Ruta | Recurso |
| --- | --- |
| `/auth` | login y registro |
| `/users` | usuarios |
| `/books` | catálogo de libros |
| `/favorites` | favoritos y estado de lectura (`PATCH /favorites/status`) |
| `/reviews`, `/comments` | opiniones y comentarios |
| `/forums` | foros |
| `/cafes` | Café Literario |
| `/radio` | Radio Sábato |
| `/feed` | muro de actividad |
| `/metas-lectura` | metas de lectura |
| `/medal` | medallas |
| `/lists`, `/reading-lists` | listas y listas de lectura |
| `/subjects`, `/courses` | materias, cursos, docentes y libros asignados, historial de asignaciones |
| `/trivia` | preguntas, evaluaciones e intentos |
| `/teacher-panel` | métricas del panel docente |
| `/moderation` | moderación de contenido |

`server.ts` también monta **alias en español** (`/libros`, `/usuarios`, `/muro`, `/cafe`, etc.)
por compatibilidad con el front. No borrarlos sin verificar que el front no los use.
Las rutas fijas deben declararse **antes** que las paramétricas (`/history` antes de `/:id`).

CORS: los orígenes permitidos están en `server.ts`. Agregar ahí cualquier dominio nuevo del front.

## 10. Git y Pull Requests

- Ramas desde `develop`: `SAB-XXX-descripcion-en-kebab-case`, o `fix/SAB-XXX-...` para bugs.
  Si una rama depende de otra todavía sin mergear, crearla desde esa rama y avisarlo en el PR.
- Commits en español con formato *conventional commits*:
  `feat(area): ...`, `fix(area): ...`, `refactor(area): ...`.
- **No commitear** `dist/` ni `.env`. No incluir `package-lock.json` si la tarea no cambió dependencias.
- PRs contra `develop`, mergeados con **"Create a merge commit"** (no squash ni rebase:
  las ramas que dependen de otra conservan los commits compartidos).
- La descripción del PR debe incluir: qué hace, archivos, cómo se probó, migraciones
  (y cómo aplicarlas) y qué tiene que hacer el equipo al traer los cambios.
- Si el cambio afecta al front (contrato de la API, nuevos permisos), coordinar el orden de merge.

## 11. Checklist antes de abrir un PR

- [ ] `npm run typecheck` sin errores.
- [ ] Si cambió `schema.prisma`: migración incluida, idempotente y probada.
- [ ] Permisos validados en el back (el front no reemplaza esa validación).
- [ ] Roles comparados con `TipoRol`, identidad tomada de `req.userId`.
- [ ] Endpoints probados con los casos 400 / 401 / 403 / 404 relevantes.
- [ ] Sin secretos, `console.log` de depuración ni archivos ajenos a la tarea.

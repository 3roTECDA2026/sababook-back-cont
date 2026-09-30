## Descripción del Proyecto

#  Backend API: Biblioteca Cortázar

**La Gran Ocasión** es una plataforma web desarrollada para la Biblioteca Julio Cortazar de la Escuela Nacional 'Ernesto Sábato',con el objetivo de fomentar la lectura, la crítica literaria y la participación comunitaria entre alumnos y docentes. Este repositorio contiene la aplicación cliente construida bajo una arquitectura **Mobile First (RNF1)** para garantizar la accesibilidad y usabilidad.

* **Desarrollado por:** Alumnos del Instituto de Formación Docente y Tecnica N°166
* **Materia:** Práctica Docente (Prof. Lucas Salvatori).

Este repositorio contiene el servicio de **API RESTful** para la Biblioteca E. Cortázar. Es responsable de manejar la lógica de negocio, la persistencia de datos (Supabase/PostgreSQL), la seguridad (RF17) y el control de acceso basado en roles (RF3).

* **Arquitectura:** Modelo Vista Controlador (MVC) (RNF9).
* **Objetivo de Rendimiento:** Asegurar un tiempo de respuesta rápido (RNF3).

##  Stack Tecnológico

| Componente | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Framework** | **Express.js** (Node.js) | Creación rápida de la API REST. |
| **Base de Datos**| **Supabase (PostgreSQL)** | Persistencia de datos, alta confiabilidad (RNF7). |
| **Seguridad** | **JWT** | Mecanismo para la autenticación y control de sesión. |

##  Instalación y Ejecución Local

### 1. Prerrequisitos
* [Node.js](https://nodejs.org/)
* Una cuenta y proyecto activo en [Supabase](https://supabase.com/).

### 2. Clonar el repositorio
```bash
git clone [https://github.com/TurcoDev/sababook-back.git]
cd sababook-back
### 3. Instalar Dependencias

npm install
### 4. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz. Para trabajar **sin tocar la base real**, usá la configuración local:

```env
# Configuración de la API
PORT=3001
JWT_SECRET="una_clave_secreta_fuerte_aqui"

# Base local en Docker (contenedor sababook-postgres)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/sababook"

# Opcional: Clave inicial para crear el primer usuario Admin
ADMIN_INITIAL_KEY="ADMIN1234"
```

Para volver a la base real, reemplazá el `DATABASE_URL` por el de Supabase (usá el Pooler IPv4 para evitar problemas de conexión):

```env
DATABASE_URL="postgresql://postgres.[TU_PROYECTO_REF]:[TU_CONTRASEÑA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

### 5. Levantar la Base de Datos Local

La base local es un PostgreSQL 15 en Docker, con volumen persistente `sababook_pgdata`. Los datos quedan en tu máquina: **no se sube nada a Supabase**.

```bash
npm run db:up      # levanta el contenedor (o lo crea si no existe)
npm run db:reset   # crea el esquema con prisma db push + carga los datos de prueba
```

Otros comandos útiles:

| Comando | Qué hace |
| :--- | :--- |
| `npm run db:up` | Levanta el contenedor en `localhost:5433` |
| `npm run db:down` | Lo detiene (los datos se conservan) |
| `npm run db:logs` | Muestra los logs del contenedor |
| `npm run db:shell` | Abre `psql` contra la base local |
| `npm run db:push` | Sincroniza el esquema de `prisma/schema.prisma` |
| `npm run db:seed` | Recarga los datos de `prisma/seed.sql` |
| `npm run db:reset` | `db:push` + `db:seed` (deja todo listo de cero) |

> El puerto **5433** se usa porque el 5432 ya está ocupado por otro proyecto local. Si lo liberás, cambiá el puerto en el `docker run` del script `db:up` y en el `DATABASE_URL`.

Los datos de prueba están en `prisma/seed.sql` (tomados de `dump.sql` y completados con las tablas que faltaban). **Todas las contraseñas son `123456`**: `ana.garcia@email.com` (docente), `juan.perez@email.com` (alumno), `laura.martinez@email.com` (administradora).

### 6. Iniciar el Servidor

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3001` (3000 lo ocupa `edu-track-back`).

### 7. Exportar la base real

Para bajar un backup de Supabase a `dump.sql`:

```bash
pg_dump "<DATABASE_URL_REMOTA>" > dump.sql
```


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

Crea un archivo `.env` en la raíz (puedes copiar la plantilla desde `.env.example`):

```bash
cp .env.example .env
```

Configura tu string de conexión de **Supabase (PostgreSQL)** en la variable `DATABASE_URL`:

```env
# Configuración de la API
PORT=3001
JWT_SECRET="una_clave_secreta_fuerte_aqui"

# Conexión a Supabase (PostgreSQL)
DATABASE_URL="postgresql://postgres:[TU_CONTRASEÑA]@db.[TU_PROYECTO_REF].supabase.co:5432/postgres"
```

> **Nota para Supabase Connection Pooling (IPv4 / PGBouncer):**  
> Si usás el pooler de Supabase en puerto 6543, recordá incluir `?pgbouncer=true` al final del `DATABASE_URL`.

### 5. Sincronizar el Esquema de Prisma con Supabase

Para aplicar el esquema de la base de datos en Supabase y generar el cliente de Prisma:

```bash
# Aplica las tablas y modelos definidos en prisma/schema.prisma a Supabase
npm run db:push

# Genera el cliente de Prisma
npm run db:generate
```

Comandos útiles de Prisma:

| Comando | Qué hace |
| :--- | :--- |
| `npm run db:push` | Sincroniza el esquema de `prisma/schema.prisma` directamente en Supabase |
| `npm run db:generate` | Regenera `@prisma/client` |
| `npm run db:studio` | Abre la interfaz gráfica de Prisma Studio para explorar y editar los datos |

### 6. Iniciar el Servidor

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3001`.



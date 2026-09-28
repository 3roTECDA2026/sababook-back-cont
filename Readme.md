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
| **Base de Datos**| **PostgreSQL** | Persistencia de datos, alta confiabilidad (RNF7). |
| **ORM** | **Prisma** | Modelado del esquema y versionado con Prisma Migrate. |
| **Seguridad** | **JWT** | Mecanismo para la autenticación y control de sesión. |

##  Instalación y Ejecución Local

### 1. Prerrequisitos
* [Node.js](https://nodejs.org/)
* Una instancia de PostgreSQL 14 o superior accessible (local o remota).

### 2. Clonar el repositorio
```bash
git clone https://github.com/3roTECDA2026/sababook-back-cont.git
cd sababook-back-cont
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Configurar Variables de Entorno
Crea un archivo .env en la raíz con la siguiente información:

```bash
# Configuración de la API
PORT=3000
JWT_SECRET="una_clave_secreta_fuerte_aqui"

# Conexión a PostgreSQL (usada por Prisma)
DATABASE_URL="postgresql://usuario:password@localhost:5432/sababook"
```

### 5. Aplicar las migraciones de la base de datos

El esquema de Prisma (`prisma/schema.prisma`) se versiona con **Prisma Migrate**. Las
migraciones viven en `prisma/migrations/`, por lo que el esquema queda auditado en el
repositorio y cualquier equipo puede replicar la base desde cero.

```bash
# Instala dependencias (postinstall ya corre prisma generate)
npm install

# Crea/aplica las migraciones en desarrollo y genera el cliente
npm run prisma:migrate

# Aplica las migraciones ya existentes sin prompts (CI / producción)
npm run prisma:migrate:deploy

# Verifica el estado de la base frente a las migraciones
npm run prisma:migrate:status

# Explorador visual de datos
npm run prisma:studio
```

> **Importante:** ya no se debe usar `prisma db push` para reflecting cambios en el
> repositorio, porque no genera archivos de migración. El flujo correcto es
> `npm run prisma:migrate` (que crea la carpeta en `prisma/migrations/` y hay que
> commitearla).

### 6. Iniciar el Servidor

```bash
npm run dev
```

El servidor estará disponible en http://localhost:3000.




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

Crea un archivo `.env` en la raíz con la siguiente información:

```env
# Configuración de la API
PORT=3000
JWT_SECRET="una_clave_secreta_fuerte_aqui"

# Conexión a PostgreSQL / Supabase (Utiliza el Pooler IPv4 para evitar problemas de conexión)
DATABASE_URL="postgresql://postgres.[TU_PROYECTO_REF]:[TU_CONTRASEÑA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Opcional: Clave inicial para crear el primer usuario Admin
ADMIN_INITIAL_KEY="ADMIN1234"
```

### 5. Inicializar la Base de Datos

Para crear las tablas, llaves foráneas e índices en tu base de datos remota de Supabase:

```bash
npm run setup-db
```

### 6. Generar un Backup / Dump

Para exportar la estructura y datos de todas las tablas a un archivo `dump.sql`:

```bash
npm run dump
```

### 7. Iniciar el Servidor

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`.

-- SAB-136: PUT /users/:id guardaba la contraseña sin hashear, y esos usuarios no podían
-- iniciar sesión (el login compara con bcrypt). Se hashean con bcrypt solo las que no son
-- un hash: los usuarios conservan la contraseña que tenían y vuelven a poder entrar.
-- pgcrypto genera hashes $2a$, que bcrypt de Node acepta. En Supabase vive en el esquema extensions.
-- Idempotente: una vez hasheadas, ya no cumplen la condición.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

UPDATE "usuario"
SET "contrasena" = extensions.crypt("contrasena", extensions.gen_salt('bf', 10))
WHERE "contrasena" !~ '^\$2[aby]\$[0-9]{2}\$.{53}$';

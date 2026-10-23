
UPDATE "libro" l
SET "calificacion_promedio" = sub.promedio
FROM (
    SELECT "libro_id", ROUND(AVG("calificacion")::numeric, 2)::float8 AS promedio
    FROM "opinion"
    WHERE "calificacion" IS NOT NULL
    GROUP BY "libro_id"
) sub
WHERE l."libro_id" = sub."libro_id";

UPDATE "libro"
SET "calificacion_promedio" = NULL
WHERE "libro_id" NOT IN (
    SELECT DISTINCT "libro_id" FROM "opinion" WHERE "calificacion" IS NOT NULL
);
# Gestión de Portadas de Libros 📚

## Resumen de Ejecución

**Fecha:** 2026-09-21  
**Estado:** ✅ Completado (según `libros-pendientes-portada.json`)

### Estadísticas (fuente: `libros-pendientes-portada.json`)
- **Total sin portada (inicial):** 129
- **Encontradas en primera ronda:** 28
- **Encontradas en segunda ronda:** 103
- **Pendientes:** 28
- **Tasa de éxito reportada:** 79%

> Nota: estas cifras se transcriben exactamente del JSON de pendientes.

---

## Script utilizado

### `get-book-cover-alternative.js`
Obtiene portadas desde múltiples fuentes en orden de intento:

1. **OpenLibrary (v2)**
2. **Google Books API**
3. **Internet Archive**

Ejecución:

```bash
node --experimental-modules data/get-book-cover-alternative.js
```

### Comportamiento del script
- Consulta solo libros con `portada_url: null`.
- Busca por **título + autor**.
- En OpenLibrary, si falla la primera búsqueda, hace fallback a **solo título**.
- Convierte miniaturas de Google Books de `http` a `https`.
- Guarda la portada en base de datos cuando encuentra URL válida.
- Espera **300 ms** entre libros para evitar sobrecarga de APIs.
- Reporta al final:
  - cantidad actualizada,
  - cantidad no encontrada,
  - porcentaje de éxito de la corrida.

---

## Libros pendientes de portada

**Total: 28** (fuente: `libros-pendientes-portada.json`)

```
1. Antígona furiosa - G. Gambaro
2. Adiós Rapa Nui - Gil López
3. Caballero negro/Puertas adentro - L. Lardone
4. Miedos de invierno - Pérez Díaz
5. Cabecita negra y otros cuentos - G. Rozenmarcher
6. Dos años, ocho meses y dieciocho noches - S. Rusdhie
7. Carta al Sargento Kirk - Juan Sasturain
8. La valija de Benavídez, Perdiendo velocidad - S. Schweblin
9. El gigante de Balvanera y otras levendas urbanas - S. Silvestre
10. Anna Karernina - L. Tolstoi
11. Es tan difícil volver a Ítaca - E. Valentino
12. Inventario y otros poemas - Mario Benedetti
13. Asesinato en el Expreso Oriente - Agatha Christie
14. Las venas abiertas de América Lat - Eduardo Galeano
15. Y el fútbol contó un cuento… - Eduardo Sacheri
16. Teatro abierto 81 - AA.VV.
17. Nosotras en Libertad - AA.VV.
18. Tributo del mundo - Diana Bellesi
19. Los teresos - Fabián Casas
20. Los perros:1956 - M. Faust
21. El tormento más purto - Fernanda García Lao
22. El niño proletario - O. Lamborghini
23. Bolonqui - L. Oyola
24. Tengo una novia bisexual - Guillermo Sacomanno
25. La arena en los zapatos - J. Sasturain
26. Cuidado que hay trampa - A. Shúa
27. Prontuario - D. Viñas
28. Un dios cotidiano - D. Viñas
```

---

## Observaciones y recomendaciones (según JSON)

- Hay títulos/autores con posibles typos (ej.: *Rusdhie*, *Karernina*, *América Lat*).
- Parte de los pendientes pueden ser antologías/cuentos sin portada individual.
- Considerar imagen por defecto para casos sin portada disponible.
- Si se requiere mejor cobertura, usar ISBNs correctos y revisión manual puntual.

---

**Última actualización:** 2026-09-21  
**Fuente:** `libros-pendientes-portada.json` + `get-book-cover-alternative.js`

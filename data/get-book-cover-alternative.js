// Script para obtener portadas de fuentes alternativas (Google Books, ISBNdb, etc.)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Obtener portada desde Google Books API (requiere API key gratuita)
async function obtenerPortadaGoogleBooks(titulo, autor) {
  try {
    const q = new URLSearchParams({
      q: `${titulo} ${autor}`,
      maxResults: '5',
      printType: 'books'
    });
    
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${q}`);
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        if (item.volumeInfo?.imageLinks?.thumbnail) {
          // Google Books usa http, convertir a https
          return item.volumeInfo.imageLinks.thumbnail.replace('http://', 'https://');
        }
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Obtener portada desde Internet Archive (sin API key)
async function obtenerPortadaInternetArchive(titulo, autor) {
  try {
    // Buscar por ISBN primero o por título
    const q = new URLSearchParams({
      q: `${titulo} ${autor}`,
      output: 'json'
    });
    
    const res = await fetch(`https://archive.org/advancedsearch.php?${q}`);
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.response?.docs && data.response.docs.length > 0) {
      const book = data.response.docs[0];
      if (book.identifier) {
        return `https://covers.archive.org/books/id/${book.identifier}-M.jpg`;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Obtener portada desde Open Library con mejores parámetros
async function obtenerPortadaOpenLibraryV2(titulo, autor) {
  try {
    // Intenta primero por autor
    const q = new URLSearchParams({
      q: `${titulo} ${autor}`,
      limit: '5',
      language: 'spa'
    });
    
    const res = await fetch(`https://openlibrary.org/search.json?${q}`);
    if (!res.ok) return null;
    
    const data = await res.json();
    for (const doc of data.docs ?? []) {
      if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
    }
    
    // Intenta solo con el título
    const q2 = new URLSearchParams({
      title: titulo,
      limit: '5'
    });
    const res2 = await fetch(`https://openlibrary.org/search.json?${q2}`);
    if (!res2.ok) return null;
    
    const data2 = await res2.json();
    for (const doc of data2.docs ?? []) {
      if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('🔍 Buscando portadas en fuentes alternativas...\n');
  
  const libros = await prisma.libro.findMany({ 
    where: { portada_url: null }
  });
  
  console.log(`📚 Total de libros sin portada: ${libros.length}\n`);
  
  let actualizado = 0;
  let noEncontrado = 0;
  
  for (const libro of libros) {
    let url = null;
    
    // Intenta en orden: OpenLibrary v2, Google Books, Internet Archive
    url = await obtenerPortadaOpenLibraryV2(libro.titulo, libro.autor);
    if (url) {
      console.log(`✔ OpenLibrary: ${libro.titulo}`);
      await prisma.libro.update({ 
        where: { libro_id: libro.libro_id }, 
        data: { portada_url: url } 
      });
      actualizado++;
    } else {
      url = await obtenerPortadaGoogleBooks(libro.titulo, libro.autor);
      if (url) {
        console.log(`✔ Google Books: ${libro.titulo}`);
        await prisma.libro.update({ 
          where: { libro_id: libro.libro_id }, 
          data: { portada_url: url } 
        });
        actualizado++;
      } else {
        url = await obtenerPortadaInternetArchive(libro.titulo, libro.autor);
        if (url) {
          console.log(`✔ Internet Archive: ${libro.titulo}`);
          await prisma.libro.update({ 
            where: { libro_id: libro.libro_id }, 
            data: { portada_url: url } 
          });
          actualizado++;
        } else {
          console.log(`✖ No encontrado: ${libro.titulo} - ${libro.autor}`);
          noEncontrado++;
        }
      }
    }
    
    // Cortesía con las APIs
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n✅ Actualizado: ${actualizado}`);
  console.log(`❌ No encontrado: ${noEncontrado}`);
  console.log(`📊 Éxito: ${Math.round(actualizado / libros.length * 100)}%`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

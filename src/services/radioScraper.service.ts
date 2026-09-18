// src/services/radioScraper.service.ts
import axios from 'axios';
import * as cheerio from 'cheerio';

const PROGRAMAS_URL = 'https://sites.google.com/sabato.unicen.edu.ar/radiosabato/programas';

export interface ProgramaScraped {
  titulo: string;
  audio_url: string;
  programa?: string;
  descripcion?: string;
}

export const sincronizarRadioSabato = async (): Promise<ProgramaScraped[]> => {
  try {
    const { data: html } = await axios.get(PROGRAMAS_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const resultados: ProgramaScraped[] = [];
    const idsEncontrados = new Set<string>();

    // 1. Extraer IDs de Google Drive mediante Regex en todo el contenido HTML/JS
    const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|file\/d\/)([a-zA-Z0-9_-]{25,})/g;
    let match;

    while ((match = driveRegex.exec(html)) !== null) {
      const fileId = match[1];
      if (!idsEncontrados.has(fileId)) {
        idsEncontrados.add(fileId);
        
        // URL apta para reproducción directa e iframe embedding
        const audioUrl = `https://drive.google.com/file/d/${fileId}/preview`;
        
        resultados.push({
          titulo: `Programa Radio Sábato (Drive ID: ${fileId.substring(0, 6)}...)`,
          audio_url: audioUrl,
          programa: 'Radio Sábato',
          descripcion: 'Programa extraído de la sección oficial de Radio Sábato.',
        });
      }
    }

    // 2. Respaldo adicional: buscar enlaces directos de audio .mp3 si los hubiere
    const $ = cheerio.load(html);
    $('a[href*=".mp3"]').each((_, elem) => {
      const href = $(elem).attr('href');
      if (href) {
        resultados.push({
          titulo: $(elem).text().trim() || 'Programa de Radio',
          audio_url: href,
          programa: 'Radio Sábato',
          descripcion: 'Archivo de audio en vivo / descarga directas.',
        });
      }
    });

    return resultados;
  } catch (error) {
    console.error('Error al realizar el scraping de Radio Sábato:', error);
    return [];
  }
};
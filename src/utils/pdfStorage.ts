// src/utils/pdfStorage.ts
import { randomUUID } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// SAB-67: los PDFs de material de lectura se guardan en un bucket privado de Supabase Storage.
// El disco de Render se borra en cada deploy, así que no se guardan en el servidor.
export const MAX_PDF_SIZE_MB = 25;
// En bytes, con MB = 1.000.000 como el límite del bucket en Supabase ("25 MB" = 25.000.000)
export const MAX_PDF_SIZE = MAX_PDF_SIZE_MB * 1000 * 1000;
const SIGNED_URL_SECONDS = 60 * 60;
const DEFAULT_BUCKET = 'material-lectura';

// Falla de configuración o de Supabase Storage: el controller responde 502
export class PdfStorageError extends Error {}

let client: SupabaseClient | null = null;

// Se crea al primer uso para que el server arranque aunque falten las variables
const getClient = (): SupabaseClient => {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new PdfStorageError('Falta configurar SUPABASE_URL o SUPABASE_SECRET_KEY.');
  }

  client = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
};

const bucket = () => getClient().storage.from(process.env.SUPABASE_PDF_BUCKET || DEFAULT_BUCKET);

// Se valida el contenido, no la extensión ni el Content-Type que manda el cliente
export const isPdf = (buffer: Buffer): boolean =>
  buffer.subarray(0, 5).toString('latin1') === '%PDF-';

// Devuelve la ruta dentro del bucket, que es lo que se guarda en libro.pdf_path
export const uploadPdf = async (bookId: number, buffer: Buffer): Promise<string> => {
  const path = `libros/${bookId}/${randomUUID()}.pdf`;
  const { error } = await bucket().upload(path, buffer, {
    contentType: 'application/pdf',
    upsert: false,
  });
  if (error) throw new PdfStorageError(error.message);
  return path;
};

export const removePdf = async (path: string): Promise<void> => {
  const { error } = await bucket().remove([path]);
  if (error) throw new PdfStorageError(error.message);
};

// URL temporal para leer el PDF: el bucket es privado
export const getSignedPdfUrl = async (path: string): Promise<string> => {
  const { data, error } = await bucket().createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error || !data) throw new PdfStorageError(error?.message ?? 'No se pudo firmar la URL.');
  return data.signedUrl;
};

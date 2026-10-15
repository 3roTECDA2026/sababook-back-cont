export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

const toInt = (v: unknown): number | undefined => {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Devuelve null si el cliente no pidió paginación (modo legacy).
 */
const isEmpty = (v: unknown) => v === undefined || v === null || v === '';

export function parsePagination(
  query: { page?: unknown; limit?: unknown },
  defaultLimit = 10,
  maxLimit = 50
): PaginationParams | null {
  if (isEmpty(query.page) && isEmpty(query.limit)) return null;

  const page = Math.max(toInt(query.page) ?? 1, 1);
  const limit = Math.min(Math.max(toInt(query.limit) ?? defaultLimit, 1), maxLimit);

  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginated<T>(
  data: T[],
  total: number,
  { page, limit }: PaginationParams
): Paginated<T> {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return { data, total, page, limit, totalPages, hasMore: page < totalPages };
}
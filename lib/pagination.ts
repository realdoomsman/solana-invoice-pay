/**
 * Pagination Utility
 * Task 20.1: Paginate large results for database optimization
 * 
 * Provides consistent pagination support across API endpoints
 * with cursor-based and offset-based pagination options.
 */

export interface PaginationParams {
  page?: number
  limit?: number
  cursor?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
    nextCursor?: string
    prevCursor?: string
  }
}

export interface CursorPaginationResult<T> {
  data: T[]
  pagination: {
    limit: number
    hasNext: boolean
    hasPrev: boolean
    nextCursor?: string
    prevCursor?: string
  }
}

/**
 * Default pagination settings
 */
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100
export const MIN_PAGE_SIZE = 1

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10)
  const cursor = searchParams.get('cursor') || undefined
  const sortBy = searchParams.get('sortBy') || undefined
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

  return {
    page: Math.max(1, page),
    limit: Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, limit)),
    cursor,
    sortBy,
    sortOrder,
  }
}

/**
 * Calculate offset from page and limit
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit
}

/**
 * Calculate total pages from total count and limit
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit)
}

/**
 * Create pagination result object
 */
export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  const totalPages = calculateTotalPages(total, limit)

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

/**
 * Create cursor-based pagination result
 */
export function createCursorPaginationResult<T>(
  data: T[],
  limit: number,
  getCursor: (item: T) => string
): CursorPaginationResult<T> {
  const hasNext = data.length > limit
  const actualData = hasNext ? data.slice(0, limit) : data

  return {
    data: actualData,
    pagination: {
      limit,
      hasNext,
      hasPrev: false, // Cursor pagination typically doesn't support prev
      nextCursor: hasNext && actualData.length > 0 
        ? getCursor(actualData[actualData.length - 1]) 
        : undefined,
    },
  }
}

/**
 * Encode cursor for pagination
 */
export function encodeCursor(value: string | number | Date): string {
  const stringValue = value instanceof Date ? value.toISOString() : String(value)
  return Buffer.from(stringValue).toString('base64')
}

/**
 * Decode cursor from pagination
 */
export function decodeCursor(cursor: string): string {
  try {
    return Buffer.from(cursor, 'base64').toString('utf-8')
  } catch {
    throw new Error('Invalid cursor')
  }
}

/**
 * Apply pagination to Supabase query (offset-based)
 */
export function applyOffsetPagination<T>(
  query: any,
  params: PaginationParams
): any {
  const { page = 1, limit = DEFAULT_PAGE_SIZE } = params
  const offset = calculateOffset(page, limit)

  return query.range(offset, offset + limit - 1)
}

/**
 * Apply sorting to Supabase query
 */
export function applySorting(
  query: any,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): any {
  return query.order(sortBy, { ascending: sortOrder === 'asc' })
}

/**
 * Get total count from Supabase query
 */
export async function getTotalCount(query: any): Promise<number> {
  const { count, error } = await query.select('*', { count: 'exact', head: true })
  
  if (error) {
    console.error('Error getting total count:', error)
    return 0
  }

  return count || 0
}

/**
 * Execute paginated Supabase query with count
 */
export async function executePaginatedQuery<T>(
  baseQuery: any,
  params: PaginationParams
): Promise<PaginationResult<T>> {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, sortBy, sortOrder } = params

  // Get total count
  const total = await getTotalCount(baseQuery)

  // Apply sorting and pagination
  let query = baseQuery
  if (sortBy) {
    query = applySorting(query, sortBy, sortOrder)
  }
  query = applyOffsetPagination(query, params)

  // Execute query
  const { data, error } = await query

  if (error) {
    throw new Error(`Query execution failed: ${error.message}`)
  }

  return createPaginationResult(data || [], total, page, limit)
}

/**
 * Execute cursor-based paginated query
 */
export async function executeCursorPaginatedQuery<T>(
  baseQuery: any,
  params: PaginationParams,
  cursorField: string = 'created_at'
): Promise<CursorPaginationResult<T>> {
  const { limit = DEFAULT_PAGE_SIZE, cursor, sortOrder = 'desc' } = params

  let query = baseQuery

  // Apply cursor filter if provided
  if (cursor) {
    const decodedCursor = decodeCursor(cursor)
    const operator = sortOrder === 'desc' ? 'lt' : 'gt'
    query = query[operator](cursorField, decodedCursor)
  }

  // Apply sorting
  query = applySorting(query, cursorField, sortOrder)

  // Fetch one extra to check if there's a next page
  query = query.limit(limit + 1)

  // Execute query
  const { data, error } = await query

  if (error) {
    throw new Error(`Query execution failed: ${error.message}`)
  }

  return createCursorPaginationResult(
    data || [],
    limit,
    (item: any) => encodeCursor(item[cursorField])
  )
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(params: PaginationParams): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (params.page !== undefined && params.page < 1) {
    errors.push('Page must be greater than 0')
  }

  if (params.limit !== undefined) {
    if (params.limit < MIN_PAGE_SIZE) {
      errors.push(`Limit must be at least ${MIN_PAGE_SIZE}`)
    }
    if (params.limit > MAX_PAGE_SIZE) {
      errors.push(`Limit cannot exceed ${MAX_PAGE_SIZE}`)
    }
  }

  if (params.sortOrder && !['asc', 'desc'].includes(params.sortOrder)) {
    errors.push('Sort order must be "asc" or "desc"')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

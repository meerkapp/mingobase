import type { MongoFilter, MongoSort } from './types'

type FilterBuilder = {
  eq: (column: string, value: unknown) => FilterBuilder
  neq: (column: string, value: unknown) => FilterBuilder
  gt: (column: string, value: unknown) => FilterBuilder
  gte: (column: string, value: unknown) => FilterBuilder
  lt: (column: string, value: unknown) => FilterBuilder
  lte: (column: string, value: unknown) => FilterBuilder
  in: (column: string, values: unknown[]) => FilterBuilder
  not: (column: string, operator: string, value: unknown) => FilterBuilder
  is: (column: string, value: null | boolean) => FilterBuilder
  ilike: (column: string, pattern: string) => FilterBuilder
  or: (filters: string) => FilterBuilder
  order: (column: string, options?: { ascending?: boolean }) => FilterBuilder
  limit: (count: number) => FilterBuilder
  range: (from: number, to: number) => FilterBuilder
  select: (columns?: string) => FilterBuilder
}

const isOperatorObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  return Object.keys(value).some(key => key.startsWith('$'))
}

const regexToPattern = (regex: string | RegExp): string => {
  const pattern = typeof regex === 'string' ? regex : regex.source
  return pattern
    .replace(/^\^/, '')
    .replace(/\$$/, '')
    .replace(/\.\*/g, '%')
    .replace(/\./g, '_')
}

export const applyFieldFilter = <T extends FilterBuilder>(
  query: T,
  field: string,
  filter: unknown
): T => {
  if (!isOperatorObject(filter)) {
    return (filter === null ? query.is(field, null) : query.eq(field, filter)) as T
  }

  const ops = filter as Record<string, unknown>

  for (const [op, value] of Object.entries(ops)) {
    switch (op) {
      case '$eq':
        query = (value === null ? query.is(field, null) : query.eq(field, value)) as T
        break
      case '$ne':
        query = (value === null ? query.not(field, 'is', null) : query.neq(field, value)) as T
        break
      case '$gt':
        query = query.gt(field, value) as T
        break
      case '$gte':
        query = query.gte(field, value) as T
        break
      case '$lt':
        query = query.lt(field, value) as T
        break
      case '$lte':
        query = query.lte(field, value) as T
        break
      case '$in':
        if (Array.isArray(value)) {
          query = query.in(field, value) as T
        }
        break
      case '$nin':
        if (Array.isArray(value)) {
          query = query.not(field, 'in', `(${value.map(v =>
            typeof v === 'string' ? `"${v}"` : v
          ).join(',')})`) as T
        }
        break
      case '$regex':
        query = query.ilike(field, `%${regexToPattern(value as string | RegExp)}%`) as T
        break
      case '$exists':
        query = (value ? query.not(field, 'is', null) : query.is(field, null)) as T
        break
    }
  }

  return query
}

export const applyFilter = <T extends FilterBuilder>(
  query: T,
  filter: MongoFilter
): T => {
  for (const [key, value] of Object.entries(filter)) {
    if (key === '$and' && Array.isArray(value)) {
      for (const subFilter of value) {
        query = applyFilter(query, subFilter)
      }
      continue
    }

    if (key === '$or' && Array.isArray(value)) {
      const orConditions = value.map(subFilter => {
        return Object.entries(subFilter)
          .map(([field, fieldFilter]) => {
            if (!isOperatorObject(fieldFilter)) {
              return fieldFilter === null ? `${field}.is.null` : `${field}.eq.${fieldFilter}`
            }

            const ops = fieldFilter as Record<string, unknown>
            return Object.entries(ops)
              .map(([op, opValue]) => {
                switch (op) {
                  case '$eq': return `${field}.eq.${opValue}`
                  case '$ne': return `${field}.neq.${opValue}`
                  case '$gt': return `${field}.gt.${opValue}`
                  case '$gte': return `${field}.gte.${opValue}`
                  case '$lt': return `${field}.lt.${opValue}`
                  case '$lte': return `${field}.lte.${opValue}`
                  case '$in': return `${field}.in.(${(opValue as unknown[]).join(',')})`
                  default: return ''
                }
              })
              .filter(Boolean)
              .join(',')
          })
          .join(',')
      }).join(',')

      query = query.or(orConditions) as T
      continue
    }

    if (!key.startsWith('$')) {
      query = applyFieldFilter(query, key, value)
    }
  }

  return query
}

export const applySort = <T extends FilterBuilder>(
  query: T,
  sort: MongoSort
): T => {
  for (const [field, direction] of Object.entries(sort)) {
    query = query.order(field, { ascending: direction === 1 || direction === 'asc' }) as T
  }
  return query
}

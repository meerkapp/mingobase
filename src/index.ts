import type { SupabaseClient as SupabaseClientType } from '@supabase/supabase-js'
import type { MongoFilter, MongoSort } from './types'
import { applyFilter, applySort } from './operators'

export type { MongoFilter, MongoSort, ComparisonOperators, LogicalOperators } from './types'
export type SupabaseClient = SupabaseClientType<any, any, any>

export type Projection = string[] | Record<string, 0 | 1>

function buildProjection(projection?: Projection): string {
  if (!projection) return '*'
  if (Array.isArray(projection)) return projection.join(',')
  const fields = Object.entries(projection)
    .filter(([, v]) => v === 1)
    .map(([k]) => k)
    .join(',')
  return fields || '*'
}

export class Query {
  private criteria: MongoFilter

  constructor(criteria: MongoFilter) {
    this.criteria = criteria
  }

  find(client: SupabaseClient, collection: string, projection?: Projection) {
    let q: any = client.from(collection).select(buildProjection(projection))

    if (Object.keys(this.criteria).length > 0) {
      q = applyFilter(q, this.criteria)
    }

    return {
      sort(sort: MongoSort) {
        q = applySort(q, sort)
        return this
      },
      skip(n: number) {
        q = q.range(n, n + 999)
        return this
      },
      limit(n: number) {
        q = q.limit(n)
        return this
      },
      range(from: number, to: number) {
        q = q.range(from, to)
        return this
      },
      query() {
        return q
      },
      all() {
        return q
      }
    }
  }
}

export function translateFilter<T>(query: T, filter: MongoFilter): T {
  return applyFilter(query as Parameters<typeof applyFilter>[0], filter) as T
}

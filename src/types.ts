export interface ComparisonOperators {
  $eq?: unknown
  $ne?: unknown
  $gt?: unknown
  $gte?: unknown
  $lt?: unknown
  $lte?: unknown
  $in?: unknown[]
  $nin?: unknown[]
  $regex?: string | RegExp
  $exists?: boolean
}

export interface LogicalOperators {
  $and?: MongoFilter[]
  $or?: MongoFilter[]
  $not?: MongoFilter
  $nor?: MongoFilter[]
}

export type FieldFilter = unknown | ComparisonOperators

export type MongoFilter = LogicalOperators & {
  [field: string]: FieldFilter
}

export type SortDirection = 1 | -1 | 'asc' | 'desc'

export type MongoSort = Record<string, SortDirection>

# mingobase

Translate MongoDB query syntax to Supabase JS queries.

## Install

```bash
npm install mingobase
```

Requires `@supabase/supabase-js` as peer dependency.

## Usage

```typescript
import { createClient } from "@supabase/supabase-js";
import { Query } from "mingobase";

const supabase = createClient(url, key);

const query = new Query({ age: { $gte: 18 }, status: "active" });

const { data } = await query
  .find(supabase, "users", ["id", "name", "email"])
  .sort({ createdAt: -1 })
  .limit(10)
  .all();
```

## API

### new Query(criteria)

Creates a reusable query with MongoDB-style filter criteria.

### query.find(client, collection, projection?)

Returns a cursor with chainable methods:

| Method                 | Description                   |
| ---------------------- | ----------------------------- |
| `.sort({ field: -1 })` | Sort results (-1 desc, 1 asc) |
| `.limit(n)`            | Limit results                 |
| `.skip(n)`             | Skip first n results          |
| `.range(from, to)`     | Get specific range            |
| `.all()`               | Execute query                 |
| `.query()`             | Get raw Supabase query        |

### Projection

```typescript
// Array syntax
query.find(client, "users", ["id", "name"]);

// Object syntax
query.find(client, "users", { id: 1, name: 1 });
```

## Supported Operators

| MongoDB   | Supabase                        |
| --------- | ------------------------------- |
| `$eq`     | `.eq()`                         |
| `$ne`     | `.neq()`                        |
| `$gt`     | `.gt()`                         |
| `$gte`    | `.gte()`                        |
| `$lt`     | `.lt()`                         |
| `$lte`    | `.lte()`                        |
| `$in`     | `.in()`                         |
| `$nin`    | `.not().in()`                   |
| `$regex`  | `.ilike()`                      |
| `$exists` | `.is(null)` / `.not().is(null)` |
| `$and`    | chained filters                 |
| `$or`     | `.or()`                         |

## License

MIT

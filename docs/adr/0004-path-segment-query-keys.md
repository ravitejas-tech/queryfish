# 0004. Query keys are URL path segments

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

Every generated query needs a `queryKey`, and once it's picked it's very hard to change. The key shape ends up in every
`invalidateQueries`, `setQueryData` and `getQueryData` call users write. Changing it later breaks code that QueryFish
didn't generate.

Two things shaped the decision.

**react-query-kit adds the variables to the key.** A declared key of `['pets', '{petId}']` becomes
`['pets', '{petId}', { petId: '123' }]` at runtime. The library already keeps a separate cache entry per set of
variables, so that isn't a reason to prefer one base key over another.

**Prefix invalidation is the most common cache operation.** After a mutation, you nearly always want to refetch
everything about that resource. In TanStack Query that's a prefix match:

```ts
queryClient.invalidateQueries({ queryKey: ['pets'] })
```

Whether that works at all depends entirely on the base key.

## Decision

The query key is the operation's URL path, split into segments (`Operation.pathSegments`, rendered by `renderQueryKey`
in `src/emit/queries.ts`):

| Path                     | Query key                         |
| ------------------------ | --------------------------------- |
| `/pets`                  | `['pets']`                        |
| `/pets/{petId}`          | `['pets', '{petId}']`             |
| `/owners/{ownerId}/pets` | `['owners', '{ownerId}', 'pets']` |

Path parameters keep their braces. They mark the position in the path. The actual value comes from the variables object
that gets appended.

## Consequences

### What this enables

- One call invalidates a whole resource: `['pets']` matches `/pets`, `/pets/{petId}` and anything below them.
- You can work out the key from the URL, so you can write invalidation calls without opening the generated file.
- Related endpoints show up grouped together in the React Query devtools.

### What this costs

- Two operations of the same kind on the same path share a base key. They usually differ by variables, which are
  appended, so the cache entries are still separate. A prefix invalidation will hit both, which is what you want.
- The literal `'{petId}'` string in a key looks odd the first time you see it. The README and the example app both
  explain it.
- Renaming a path in the spec changes every key built from it. That's correct, since it's a different resource now, but
  it does mean caches get invalidated when you deploy.

### What we rejected

**`operationId` as the key** (`['getPet']`). This is what the README showed originally. It's simple and never collides,
but there's no relationship between endpoints: `getPet` and `listPets` share no prefix, so invalidating "all pets" means
listing every operation by hand and updating that list whenever an endpoint is added.

**OpenAPI `tags`** (`['Pets', 'getPet']`). Nice in theory, but tags are optional, often missing, and used
inconsistently. A key strategy that quietly gets worse on half of real specs isn't good enough.

**Making the key strategy configurable.** Tempting, but every example and doc page would need an "unless you configured
it differently" note, and the test matrix would multiply, all for a preference rather than a real need. Worth revisiting
if someone has a case that path segments really can't handle.

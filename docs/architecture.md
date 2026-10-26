# Architecture

How QueryFish turns an OpenAPI document into typed React Query hooks, and why it's put together the way it is. If you
want to contribute, start here.

The bigger decisions are written up in more detail, including the alternatives we didn't pick, in the
[ADRs](./adr/).

---

## The pipeline

Generation runs in four stages. Each one takes data in and returns data out with no shared state, so each can be tested
on its own.

```
spec (file | URL | JSON | YAML)
  │
  ├─ 1. loader/   → one bundled document, $refs kept as pointers
  ├─ 2. ir/       → Operation[] plus the named types
  ├─ 3. emit/     → TypeScript source, one emitter per output file
  └─ 4. write     → format with Prettier, compare with disk, write (or --dry-run)
```

### Why have an IR at all?

The simplest design would walk the OpenAPI document and print TypeScript as it goes. We don't, for three reasons:

1. **The hard problems need a whole-spec view.** Breaking cycles, resolving name collisions and attaching pagination
   info all need a normalized model. Doing them while printing means doing them again in every emitter, each time a
   little differently.
2. **Emitters stay small.** An emitter is `(ir, config) => string`. It doesn't parse the spec or chase `$ref`s.
3. **New outputs are cheap.** Zod schemas, MSW handlers and plugins would each be another emitter over the same IR, not
   a rewrite.

See [ADR 0002](./adr/0002-four-stage-pipeline-with-an-ir.md).

---

## Stage 1: Loader

`src/loader/`

Takes a local path or an `http(s)` URL and returns a single self-contained document. Parsing is done by
[`@redocly/openapi-core`](https://www.npmjs.com/package/@redocly/openapi-core):

```ts
const config = await createConfig({ extends: ['minimal'] })
const result = await bundle({ ref: source, config, dereference: false })
const document = result.bundle.parsed
```

Redocly reads OpenAPI 3.0, 3.1 and Swagger 2.0, and pulls remote and cross-file `$ref`s into the bundle.

Note the `dereference: false`. Internal `$ref`s are kept as pointers on purpose. Dereferencing a self-referential schema
(`Comment.replies`, `Category.children`) gives you circular objects where the nested copy has lost its name, so the
generator can't tell it's `Comment` any more. The full story is in
[ADR 0003](./adr/0003-bundle-without-dereferencing.md).

When loading fails, the error is wrapped in a `SpecError` with the file, the JSON pointer and a hint where we have one,
so the CLI can tell you where the problem is instead of printing a stack trace.

---

## Stage 2: IR

`src/ir/`

Everything after this point reads the IR, never the raw spec:

```ts
interface Operation {
  operationId: string;         // resolved, no collisions
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' | ...;
  path: string;                // '/users/{id}'
  pathSegments: string[];      // ['users', '{id}'], used as the query key
  pathParams: Param[];
  queryParams: Param[];
  headerParams: Param[];
  requestBody?: IRSchema;
  response: IRSchema;          // 2xx JSON content
  kind: 'query' | 'mutation';
  pagination?: PaginationSpec; // only set when the user opted in
  deprecated: boolean;
  summary?: string;
  description?: string;
  tags: string[];
}
```

`GET` and `HEAD` become queries. Everything else becomes a mutation.

### Recursive schemas

Self-referencing schemas are common in real specs, so `SchemaConverter` in `src/ir/schema.ts` is built around them:

- Every entry in `#/components/schemas` (or `#/definitions` in Swagger 2.0) is registered up front, mapping its pointer
  to a type name. A `$ref` to a registered schema becomes a reference to that name, never an expansion. This is what
  lets `replies` come out as `Comment[]`.
- A `$ref` to anything else is resolved by hand, with an in-progress set so a cycle through unregistered schemas stops
  instead of looping.

Inline schemas that need a name get hoisted to their own top-level type. `test/fixtures/edge-cases.yaml` has cases for
self-recursion and mutual recursion, and the tests fail if either regresses.

### Naming

`src/ir/naming.ts` handles the ways real specs break naive generators:

| Case                      | What happens                                                  |
| ------------------------- | ------------------------------------------------------------- |
| Missing `operationId`     | Built from method + path (`get /users/{id}` → `getUsersById`) |
| Duplicate `operationId`   | Gets a numeric suffix, and a warning is printed               |
| Non-identifier characters | Dropped, and the rest camel-cased                             |
| Leading digit             | Prefixed with `n`                                             |
| Reserved TypeScript word  | Suffixed with `_`                                             |

Every rule has a unit test. Naming is where most first bug reports come from, so it's worth testing heavily.

---

## Stage 3: Emitters

`src/emit/`. Each emitter is `(ir, config) => string` and produces one file.

### `types.ts`

Interfaces and unions for the component schemas, plus `XxxVariables` and `XxxResponse` types for each operation. Covers
`allOf` (intersection), `oneOf`/`anyOf` (union), `nullable`, arrays, `additionalProperties` (→ `Record`), enums (→
string literal unions) and recursive types (by name).

### `requests.ts`

Plain async functions. No React, so you can call them from anywhere:

```ts
import { client } from '../client'

export const getUser = (variables: GetUserVariables) =>
    client.request<GetUserResponse>({
        method: 'GET',
        url: `/users/${variables.id}`,
    })
```

### `queries.ts`

```ts
export const useGetUser = createQuery<GetUserResponse, GetUserVariables>({
    queryKey: ['users', '{id}'],
    fetcher: getUser,
})
```

### `mutations.ts`

`createMutation`, with `mutationFn` set to the matching request function.

### `infiniteQueries.ts`

Only written when at least one operation has a `PaginationSpec`. Otherwise the file doesn't exist. See
[Pagination](#pagination-is-opt-in) below.

### `index.ts`

Re-exports everything so there's one import path.

Every file starts with a `// Generated by QueryFish — do not edit.` header and is formatted with the user's own Prettier
config, so it looks like the rest of their code.

---

## Stage 4: Writer

Lives in `src/generate.ts`. Formats each file, compares it with what's already on disk, and writes the ones that changed.
With `--dry-run` it reports what would change and writes nothing.

---

## Main design decisions

### No runtime

QueryFish doesn't ship anything that runs in the user's app. Generated code imports from `react-query-kit`,
`@tanstack/react-query` and the user's own client module, and nothing else.

The config points at that client module, and the generated requests import from it:

```ts
// queryfish.config.ts
export default defineConfig({
    input: './openapi.yaml',
    output: './src/api',
    client: './src/api/client.ts',
})
```

```ts
// src/api/client.ts, written once by the user
import axios from 'axios'
export const client = axios.create({ baseURL: '/api' })
```

That keeps interceptors, auth, retries and base URLs in the user's code, where they can debug them. The client only has
to match a small structural interface (`QueryFishClient`), so axios, `fetch`, `ky` or a custom wrapper all work. The
example app uses a `fetch` client, which helps keep the interface from turning into "whatever axios accepts". See
[ADR 0006](./adr/0006-user-supplied-http-client.md).

### Query keys are path segments

The key follows the URL:

```ts
queryKey: ['users', '{id}']
```

react-query-kit appends the variables to the key, so at runtime it's `['users', '{id}', { id: '123' }]` and each user
gets their own cache entry without us doing anything.

We use path segments instead of the operation name because of prefix invalidation, which is probably the most common
thing people do with a query client:

```ts
// invalidate every /users/* query at once
queryClient.invalidateQueries({ queryKey: ['users'] })
```

With keys like `['getUser']` there's no relationship between endpoints, and you have to list them all by hand. See
[ADR 0004](./adr/0004-path-segment-query-keys.md).

### Pagination is opt-in

OpenAPI has no standard way to describe pagination. A generator that guesses can produce a hook that looks fine,
compiles, and then fetches page 2 forever (or never gets past page 1).

So with no configuration, QueryFish emits no infinite queries at all. You opt in per endpoint, either in the config:

```ts
pagination: {
  '/users': { param: 'cursor', nextField: 'nextCursor' },
}
```

or in the spec:

```yaml
x-queryfish-pagination:
    param: cursor
    nextField: nextCursor
```

For an opted-in endpoint, the cursor param is removed from the hook's variables type and filled in from `pageParam`, so
callers can't pass it by mistake. See [ADR 0005](./adr/0005-opt-in-pagination.md).

---

## Tests

- **Snapshot tests** over three fixtures: `petstore.yaml` (realistic), `edge-cases.yaml` (recursive refs, missing and
  duplicate `operationId`s, reserved words, `allOf`/`oneOf`, 204 responses, nested inline schemas) and a Swagger 2.0
  document. The snapshots are committed, so a change to an emitter shows up in the PR as a diff of the generated code.
  That diff is the main thing to review.
- **Unit tests** for naming.
- **Compile tests** (`test/compile.test.ts`): each fixture is generated into a temp folder and checked with
  `tsc --noEmit` against the real `react-query-kit`. A snapshot only tells you the output didn't change. This tells you
  it actually compiles. See [ADR 0007](./adr/0007-verify-generated-code-compiles.md).

CI also regenerates the example app and fails if the committed output is out of date.

---

## Adding an emitter

This is the most likely kind of contribution. Roughly:

1. Add `src/emit/<name>.ts` exporting `(ir, config) => string`.
2. Register it in `src/generate.ts`.
3. Add a config flag if it should be optional.
4. Run the tests and commit the new snapshot.

If you need something from the spec that the IR doesn't have, add it to the IR rather than reading the raw document
from the emitter. Keeping that boundary is what keeps emitters simple.

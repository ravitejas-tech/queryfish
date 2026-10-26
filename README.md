<div align="center">

<img src="./assets/logo.png" alt="QueryFish" width="100%" />

**Generate typed React Query hooks from your OpenAPI spec.**

QueryFish reads an OpenAPI or Swagger document and writes the TypeScript types, request functions and
[react-query-kit](https://github.com/HuolalaTech/react-query-kit) hooks for
[TanStack Query](https://tanstack.com/query). It's a dev dependency only, and you keep your own HTTP client.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.19-brightgreen.svg)](https://nodejs.org)
[![Types](https://img.shields.io/badge/types-included-blue.svg)](https://www.typescriptlang.org/)

[Quick start](#quick-start) · [How it works](#how-it-works) · [Configuration](#configuration) · [Example app](./examples/petstore-react) · [Docs](./docs)

</div>

---

## Why

If you have an OpenAPI spec, you've already described your API once. Writing the fetch functions, types and React Query
hooks by hand means describing it three more times, and then keeping all of them in sync every time the API changes.

QueryFish generates those three from the spec, so the spec is the only thing you maintain.

```diff
- const { data } = useQuery({
-   queryKey: ['pet', petId],
-   queryFn: () => fetch(`/api/pets/${petId}`).then(r => r.json()),
- });
- // data is `any`, and the key is whatever you typed

+ const { data } = useGetPet({ variables: { petId } });
+ // data is `Pet`, and leaving out petId is a type error
```

A few things worth knowing:

- **Query keys follow your URLs.** `GET /pets/{petId}` gets the key `['pets', '{petId}']`, so invalidating `['pets']`
  refetches everything under `/pets` in one call.
- **Pagination is opt-in.** OpenAPI has no standard way to describe pagination, so QueryFish doesn't try to detect it.
  You tell it which endpoints paginate and how.
- **No runtime.** The generated code imports react-query-kit, TanStack Query and your own client module. Nothing from
  QueryFish ends up in your bundle.
- **The output is type-checked.** The test suite runs `tsc` over the generated code for every fixture, against the real
  react-query-kit types.
- **Messy specs work.** Recursive schemas, missing or duplicate `operationId`s, reserved words, `allOf`/`oneOf` and
  Swagger 2.0 are all handled.

---

## Quick start

### 1. Install

```bash
npm install --save-dev queryfish
```

The generated hooks import `@tanstack/react-query` and `react-query-kit`, so your app needs both installed.

### 2. Add a client

Generated request functions call a `client` that you export from your own code. Auth headers, interceptors and the base
URL all live there. An axios instance works as-is:

```ts
// src/api/client.ts
import axios from 'axios'

export const client = axios.create({ baseURL: '/api' })
```

If you'd rather use `fetch`, the example app has a [fetch-based client](./examples/petstore-react/src/client.ts) in
about 40 lines.

### 3. Add a config file

```ts
// queryfish.config.ts
import { defineConfig } from 'queryfish'

export default defineConfig({
    input: './openapi.yaml', // path or URL
    output: './src/api',
    client: './src/api/client.ts',
})
```

### 4. Generate

```bash
npx queryfish generate
```

```
  + types.ts
  + requests.ts
  + queries.ts
  + mutations.ts
  + index.ts
✓ Generated 6 operations → src/api
```

### 5. Use the hooks

```tsx
import { useGetPet } from './api/queries'

function Pet({ petId }: { petId: string }) {
    const { data, isPending } = useGetPet({ variables: { petId } })

    if (isPending) return <Spinner />
    return <h1>{data.name}</h1> // data is typed as Pet
}
```

---

## How it works

Say your spec has this endpoint:

```yaml
paths:
    /pets/{petId}:
        get:
            operationId: getPet
            summary: Get a pet by ID
            parameters:
                - name: petId
                  in: path
                  required: true
                  schema: { type: string }
            responses:
                '200':
                    content:
                        application/json:
                            schema: { $ref: '#/components/schemas/Pet' }
```

QueryFish writes plain TypeScript, split into a few files:

<table>
<tr><td width="50%">

**`types.ts`**

```ts
export interface Pet {
    id: string
    name: string
    tag?: string
}

export type GetPetVariables = {
    petId: string
}

export type GetPetResponse = Pet
```

</td><td width="50%">

**`requests.ts`**

```ts
import { client } from '../client'

export const getPet = (variables: GetPetVariables) =>
    client.request<GetPetResponse>({
        method: 'GET',
        url: `/pets/${variables.petId}`,
    })
```

</td></tr>
<tr><td>

**`queries.ts`**

```ts
/** Get a pet by ID */
export const useGetPet = createQuery<GetPetResponse, GetPetVariables>({
    queryKey: ['pets', '{petId}'],
    fetcher: getPet,
})
```

</td><td>

**`mutations.ts`**

```ts
/** Create a pet */
export const useCreatePet = createMutation<CreatePetResponse, CreatePetVariables>({
    mutationFn: createPet,
})
```

</td></tr>
</table>

The operation's `summary` is added as a JSDoc comment, so you see it when you hover a hook in your editor.

### Query keys follow your URLs

react-query-kit adds `variables` to the end of the key for you, so `['pets', '{petId}']` turns into
`['pets', '{petId}', { petId: '123' }]` at runtime and each pet gets its own cache entry. Because the start of the key is
the URL path, you can invalidate everything about a resource at once:

```ts
// after creating, updating or deleting a pet
queryClient.invalidateQueries({ queryKey: ['pets'] })
// covers /pets, /pets/{petId}, /pets/{petId}/toys, ...
```

If the keys were based on operation names instead, you'd have to list every affected hook yourself and remember to
update that list when an endpoint is added.

### Infinite queries are opt-in

OpenAPI doesn't describe pagination, and APIs do it in lots of different ways: cursors, page numbers, offsets, `Link`
headers. A generator that guesses wrong gives you a hook that compiles fine but stops after one page, or keeps fetching
the same one.

So QueryFish only generates infinite queries for the endpoints you point it at. You can do that in the config:

```ts
pagination: {
  '/pets': { param: 'cursor', nextField: 'nextCursor' },
}
```

or with an extension in the spec:

```yaml
x-queryfish-pagination:
    param: cursor
    nextField: nextCursor
```

Either way, you get this:

```ts
export const useListPetsInfinite = createInfiniteQuery<
    ListPetsResponse,
    Omit<ListPetsVariables, 'cursor'>, // the hook fills in cursor from pageParam
    Error,
    string | undefined
>({
    queryKey: ['pets'],
    fetcher: (variables, { pageParam }) => listPets({ ...variables, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    initialPageParam: undefined,
})
```

If nothing opts in, `infiniteQueries.ts` isn't created. The reasoning is in
[ADR 0005](./docs/adr/0005-opt-in-pagination.md).

---

## Configuration

```ts
import { defineConfig } from 'queryfish'

export default defineConfig({
    /** Path or URL to your OpenAPI/Swagger document. Required. */
    input: './openapi.yaml',

    /** Directory for generated files. Required. */
    output: './src/api',

    /** Module exporting your HTTP `client`. Default: './client' */
    client: './src/api/client.ts',

    /** Opt in to infinite queries, keyed by path. Default: none. */
    pagination: {
        '/pets': { param: 'cursor', nextField: 'nextCursor' },
    },

    /** Format output with your Prettier config. Default: true */
    format: true,

    /** Emit a barrel index.ts. Default: true */
    barrel: true,
})
```

The config file can be `.ts`, `.mts`, `.js`, `.mjs` or `.json`.

### CLI

```bash
queryfish generate [options]
```

| Option                | Description                                     |
| --------------------- | ----------------------------------------------- |
| `-c, --config <path>` | Path to config file                             |
| `-i, --input <spec>`  | Path or URL to the OpenAPI document             |
| `-o, --output <dir>`  | Output directory                                |
| `--client <module>`   | Module exporting the HTTP client                |
| `--dry-run`           | List what would change without writing anything |
| `--watch`             | Regenerate when the spec or config changes      |
| `--no-format`         | Skip Prettier formatting                        |
| `--silent`            | Only print errors                               |

Flags override values from the config file. If something in the spec is broken, the error tells you where:

```
error: cannot resolve schema
  at paths./pets.get.responses.200
  in openapi.yaml:42

  Check that the $ref target exists in components.schemas.
```

---

## What gets generated

```
src/api/
├── types.ts           # Interfaces, enums, request/response types
├── requests.ts        # Plain async functions, usable without React
├── queries.ts         # createQuery hooks (GET, HEAD)
├── mutations.ts       # createMutation hooks (POST, PUT, PATCH, DELETE)
├── infiniteQueries.ts # createInfiniteQuery hooks, only if you opt in
└── index.ts           # Re-exports everything
```

The output is formatted with your project's Prettier config. It's meant to be committed: when the spec changes, the diff
shows exactly which types and hooks changed.

---

## Specs it handles

Specs in the wild have a lot of odd corners. These are handled, and each one has a case in
[`edge-cases.yaml`](./test/fixtures/edge-cases.yaml) so it stays fixed:

|                             |                                                                  |
| --------------------------- | ---------------------------------------------------------------- |
| **Recursive schemas**       | `Comment.replies: Comment[]`, including mutually recursive types |
| **Missing `operationId`**   | Built from the method and path (`getPetsByPetIdToys`)            |
| **Duplicate `operationId`** | Gets a numeric suffix, and you get a warning                     |
| **Reserved words**          | `delete` becomes `delete_`                                       |
| **Odd parameter names**     | `filter[status]` and `X-Request-Id` are quoted                   |
| **Composition**             | `allOf` becomes an intersection, `oneOf`/`anyOf` a union         |
| **Nullability**             | Both 3.0's `nullable: true` and 3.1's `type: ['string', 'null']` |
| **Empty responses**         | `204` becomes `void`                                             |
| **Swagger 2.0**             | `definitions`, `in: body` parameters and response schemas        |

---

## Documentation

|                                          |                                                |
| ---------------------------------------- | ---------------------------------------------- |
| [Example app](./examples/petstore-react) | A small React app built on the generated hooks |
| [Architecture](./docs/architecture.md)   | How the generator works, stage by stage        |
| [Decisions (ADRs)](./docs/adr)           | Why things are the way they are                |
| [Contributing](./CONTRIBUTING.md)        | Setup, tests and how to send a PR              |
| [Conventions](./docs/conventions)        | Commits, code style, versioning                |

---

## Contributing

Contributions are welcome. Getting set up:

```bash
git clone https://github.com/ravitejas-tech/queryfish.git
cd queryfish
npm install
npm test
```

Read [CONTRIBUTING.md](./CONTRIBUTING.md) first, then [docs/architecture.md](./docs/architecture.md). If some code looks
wrong, check the [ADRs](./docs/adr) before changing it. A few of the odd-looking choices were made on purpose, and the
reasons are written down there.

Good places to start: add a spec that breaks the generator to [`edge-cases.yaml`](./test/fixtures/edge-cases.yaml), or
make an error message clearer.

---

## License

[MIT](./LICENSE)

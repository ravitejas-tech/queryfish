# Petstore example

A small React app that uses the hooks QueryFish generated from [`openapi.yaml`](./openapi.yaml).

The generated code in [`src/api/`](./src/api) is committed, so you can see what QueryFish produces without running
anything. CI regenerates it and fails if the committed copy doesn't match.

```bash
npm install
npm run generate   # regenerate src/api from openapi.yaml
npm run dev        # start the app
```

The API URL points at a placeholder host by default. Set `VITE_API_URL` if you want to point it at a real one.

## Files to look at

| File                                           | Why                                                          |
| ---------------------------------------------- | ------------------------------------------------------------ |
| [`queryfish.config.ts`](./queryfish.config.ts) | The whole config, three options                              |
| [`src/client.ts`](./src/client.ts)             | The HTTP client, which you write; QueryFish ships no runtime |
| [`src/api/`](./src/api)                        | Generated: types, requests, queries, mutations               |
| [`src/App.tsx`](./src/App.tsx)                 | The hooks in use, including prefix invalidation              |

## Things to notice

**Query keys follow the URL.** `useGetPet` uses `['pets', '{petId}']`, so one call clears every pet-related query:

```ts
queryClient.invalidateQueries({ queryKey: ['pets'] })
```

**Variables are typed from the spec.** `status` only accepts `'available' | 'pending' | 'sold'`, so a typo fails the
build instead of the request.

**Path parameters are always required.** `useGetPet({ variables: { petId } })` won't compile without `petId`, even if the
spec forgot to mark it `required`.

**There are no infinite queries.** This spec doesn't opt in to pagination, so `infiniteQueries.ts` isn't generated.

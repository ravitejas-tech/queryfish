# 0006. The HTTP client is supplied by the user

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

Generated request functions have to make HTTP requests. A generator can either ship its own client or ask the user for
one.

Shipping a client means owning the parts of HTTP that are specific to each app: auth and token refresh, retries and
backoff, picking the base URL per environment, interceptors, error handling, tracing headers. Most projects already have
opinions about all of these, usually already implemented and often not up for negotiation.

It would also break the "no runtime" goal. A bundled client is a runtime dependency. It has to stay installed in
production and match the version of the generated code.

## Decision

Generated code imports a `client` from a module the user writes. The path is set in the config:

```ts
export default defineConfig({
    input: './openapi.yaml',
    output: './src/api',
    client: './src/api/client.ts',
})
```

The client has to match a small structural interface (`QueryFishClient` in `src/index.ts`):

```ts
interface QueryFishClient {
    request<T>(config: {
        method: string
        url: string
        params?: Record<string, unknown>
        headers?: Record<string, unknown>
        data?: unknown
    }): Promise<T>
}
```

An axios instance already matches it. A `fetch` wrapper is about 40 lines; see `examples/petstore-react/src/client.ts`.

Relative paths are rewritten so they're correct from the output folder. Bare specifiers (`@/lib/client`) are left alone
so path aliases keep working.

## Consequences

### What this enables

- QueryFish is a `devDependency`. Nothing from it ends up in production.
- Auth, retries and interceptors live in the user's code, where they can read, test and debug them with their normal
  tools.
- Any HTTP library works (axios, fetch, ky, a company wrapper) with no adapter layer for us to maintain.
- Generated code has only one import from outside itself, which helps keep it readable.

### What this costs

- You can't generate anything with zero setup. Users have to write about 10 lines first. This is the main cost, and it
  hits the first-run experience.
- The interface is something users depend on. Adding to it later (say, a `signal` for cancellation) is a breaking change
  for custom clients.
- The interface is shaped like axios (`params`, `data`), which looks a bit odd to `fetch` users. The example app's fetch
  client shows how to map it.

### What we rejected

**Bundling a small fetch runtime.** Best first-run experience, but it breaks the no-runtime goal, and users who already
have interceptors would have to either migrate them or bypass the generated code.

**Putting a fetch helper inside the generated output.** Keeps the no-runtime goal and needs no setup, but then the helper
is generated code the user mustn't edit, while also being the obvious place to add auth. That's a trap.

**Supporting both, with the client optional.** Twice the surface: two code paths, two sets of docs and two ways to fail,
before anyone has told us which one they actually want. Worth reconsidering once there's real feedback.

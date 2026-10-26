# queryfish

## 1.0.1

### Patch Changes

- 36bff55: Rewrite the README in plainer language, and fix a few things it got wrong or left out. It now mentions that your app
  needs `@tanstack/react-query` and `react-query-kit` installed. It also describes `--dry-run` and `--watch` correctly.
  The package description on npm is clearer too. No changes to the generator or its output.

## 1.0.0

### Major Changes

- 5b18625: Initial release.
  
  Generates typed React Query Kit factories from OpenAPI 3.0, 3.1, and Swagger 2.0
  documents:
  
  - `createQuery` factories for `GET`/`HEAD` operations, keyed by URL path
    segments so a whole resource tree can be invalidated with a prefix match
  - `createMutation` factories for everything else
  - `createInfiniteQuery` factories, opt-in per endpoint via config or an
    `x-queryfish-pagination` extension — never inferred
  - Full TypeScript types for parameters, request bodies, and responses,
    including recursive and mutually recursive schemas
  - CLI with `--watch`, `--dry-run`, and errors that name the failing spec location
  - Zero runtime dependencies: generated code imports your own HTTP client

# 0007. Verify that generated code compiles

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

Snapshot tests are a natural fit for a code generator. They're cheap, and they turn every emitter change into a readable
diff of the output. QueryFish uses them a lot.

They have one blind spot, and for a generator it's a big one. A snapshot checks that the output **didn't change**. It
says nothing about whether the output is **valid TypeScript**. A generator can produce broken code and keep passing its
snapshot tests forever, because the snapshot was recorded from the same broken emitter.

This actually happened. Before the first release, the infinite-query emitter produced:

```ts
createInfiniteQuery<ListFeedResponse, ListFeedVariables, string | null>({ … })
```

The snapshot was fine, but the code doesn't compile. The third type parameter of `createInfiniteQuery` is `TError`, not
`TPageParam`. We'd taken the order from the library's README instead of its `.d.ts`. Everyone using that hook would have
hit a type error in code they didn't write.

A snapshot test can't catch that. Only the compiler can.

## Decision

`test/compile.test.ts` generates each fixture into a temporary folder, writes a client stub and a `tsconfig.json` next to
it, and runs `tsc --noEmit` over the result, using the real `react-query-kit` and `@tanstack/react-query` from
`node_modules`.

Any type error fails the test, with the compiler's own message.

The example app adds a second check. `examples/petstore-react` has hand-written React that uses the generated hooks, and
its `typecheck` script catches problems that only show up at the call site, like a variables type that looks right on its
own but can't actually be satisfied. CI doesn't run that script yet. For now it only regenerates the example and fails if
the committed output is out of date.

## Consequences

### What this enables

- The generated code is checked by the compiler on every run.
- Type-level regressions show up as compiler errors pointing at the exact line, instead of as bug reports.
- Contributors can change emitters without worrying: snapshots catch unexpected changes, and the compile tests catch
  invalid output.
- If a `react-query-kit` or TanStack Query upgrade changes a type signature, it fails here first.

### What this costs

- It's slower than the rest of the suite: three `tsc` runs, about 2 seconds compared with milliseconds. Worth it for what
  it catches.
- `react-query-kit`, `@tanstack/react-query` and `react` are devDependencies only so the compile test can find them.
- The test keeps its own `tsconfig`, which needs updating now and then as TypeScript changes (`baseUrl` being deprecated
  in TS 6, for example).

### What we rejected

**Snapshots alone.** That's the blind spot described above, and it let a real bug through.

**Type tests with `expectTypeOf` or `tsd`.** Good for checking specific type relationships, but they only check the
things you thought to check. Compiling all of the generated output checks everything, including the things nobody
thought of.

**Publishing and testing against a real project.** The most realistic option, but far too slow to run before every
merge. The example app gets most of the benefit for much less cost.

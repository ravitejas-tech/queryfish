# 0005. Pagination is opt-in, never inferred

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

`createInfiniteQuery` needs two things that OpenAPI can't tell us:

1. which query parameter takes the cursor, and
2. where in the response the next cursor is.

There's no standard for either. Real specs use `cursor`, `page`, `offset`, `after`, `pageToken` or `since`, and
responses use `nextCursor`, `next`, `hasMore`, `meta.next_page` or a `Link` header. Nothing in the document marks an
endpoint as paginated.

A generator could guess based on these conventions. The problem is what happens when it guesses wrong: you get a hook
that **type-checks, looks right, and only misbehaves at runtime**. Either `getNextPageParam` reads a field that's always
`undefined` (so it stops after one page), or one that's never empty (so it keeps fetching forever). In both cases the
user ends up debugging what looks like their own code, in a file they didn't write.

That's worse than not having the feature. Generated code that's quietly wrong is what makes people stop trusting a
generator.

## Decision

Infinite queries are only generated when someone explicitly opts in. There are no heuristics anywhere in the code.

Opt in per path in the config:

```ts
pagination: {
  '/pets': { param: 'cursor', nextField: 'nextCursor' },
}
```

or in the spec:

```yaml
x-queryfish-pagination:
    param: cursor
    nextField: nextCursor
```

The config takes priority over the extension, and setting a path to `false` in the config turns off an opt-in from the
spec. If nothing opts in, `infiniteQueries.ts` isn't written.

For an opted-in operation, the cursor parameter stays in the request function's signature (the fetcher passes `pageParam`
through it), but it's removed from the hook's variables with `Omit<…, 'cursor'>`, so callers can't set it themselves.

## Consequences

### What this enables

- The default output is predictable. No endpoint turns into an infinite query unexpectedly.
- When a hook is generated, its `getNextPageParam` is right, because a person told us the field name.
- Users who don't paginate get no extra code and nothing extra to learn.
- `PaginationSpec` records `paramSchema`, so `pageParam` is typed from the spec and matches the request function.

### What this costs

- With zero config you get no infinite queries, even for endpoints where a heuristic would have guessed correctly. Users
  have to add a couple of lines per endpoint.
- Two ways to opt in (config and extension) means two code paths and a priority rule to document.
- To someone skimming a feature comparison, it looks like a missing feature. This ADR and the README both explain why.

### What we rejected

**Detecting pagination with heuristics, with a config override.** Makes a better first demo, but it's wrong often enough
that the demo is about the only place it helps. The override only helps people who notice the hook is wrong, and the
failure is silent.

**Generating both a plain and an infinite query for every list endpoint.** No wrong guesses about which endpoints
paginate, but it doubles the generated code, clutters autocomplete, and still has to guess `getNextPageParam`, which is
the actual hard part.

**Leaving infinite queries out of the first release.** We seriously considered this. But opt-in produces exactly the same
output as leaving it out for anyone who doesn't opt in, and it means the IR already has the right shape, so adding more
later won't be a breaking change.

# Code style

Prettier and ESLint handle formatting, so run `npm run format` and don't worry about it. This page covers the things a
linter can't check.

## Architectural rules

PRs that break one of these will be asked to change.

### Emitters only read the IR

Code in `src/emit/` reads the IR and nothing else. If an emitter needs spec data the IR doesn't carry, add it to
`src/ir/types.ts` and fill it in from `src/ir/build.ts` first.

That boundary is why cycles, naming and pagination only have to be handled in one place. See
[ADR 0002](../adr/0002-four-stage-pipeline-with-an-ir.md).

### Don't infer what the spec doesn't say

If the spec doesn't say something, QueryFish shouldn't guess it. Ask for an explicit opt-in instead, either in the
config or with an `x-queryfish-*` extension.

A wrong guess ends up as a bug in a file the user didn't write, and it still compiles, so it's hard to spot. See
[ADR 0005](../adr/0005-opt-in-pagination.md).

### Generated code doesn't depend on QueryFish

Generated output can only import `react-query-kit`, `@tanstack/react-query` and the user's client module. QueryFish is
a `devDependency` and has to stay one. See [ADR 0006](../adr/0006-user-supplied-http-client.md).

### Generated code should look hand-written

People commit it, review it and debug it. Prefer a named type to an inline one, turn spec descriptions into JSDoc, and
don't add `as` casts to make a type error go away. A cast that hides a real mismatch just moves the error to the user's
call site.

## TypeScript

**`strict` is on, including `noUncheckedIndexedAccess`.** Indexing into an array gives you `T | undefined`. Handle the
`undefined` instead of asserting it away:

```ts
// Prefer
const first = errors[0]
if (first) throw new SpecError(String(first.message))

// Over
throw new SpecError(String(errors[0]!.message))
```

**`any` is only for raw spec data.** The OpenAPI document is untyped, which is why `@typescript-eslint/no-explicit-any`
is turned off. Once data is in the IR it's fully typed, and an `any` there will get flagged in review.

**Use `type` imports.** ESLint enforces this, and `npm run lint -- --fix` will fix it for you.

**Exported functions get a doc comment** saying what a caller needs to know. Internal helpers only need one if the name
doesn't say enough.

## Comments

**Explain why, not what.** The code already shows what it does.

```ts
// Good: explains something you can't see from the code
// Path parameters are always required, whatever the spec says.
required: location === 'path' ? true : parameter['required'] === true,

// Not useful: repeats the code
// Set required to true if location is path
```

**Leave a note where something looks wrong but isn't.** Put the comment right there, and link the ADR if there is one.
`src/loader/load.ts` is a good example: `dereference: false` looks like a mistake until you read the comment above it.

**Don't leave commented-out code.** It's in the git history if anyone needs it.

## Testing

What each kind of change needs before it can be merged:

| Change                     | Needs                                                               |
| -------------------------- | ------------------------------------------------------------------- |
| Bug fix in generation      | A case in `test/fixtures/edge-cases.yaml` that fails before the fix |
| New emitter                | Snapshot coverage, and the compile test still passes                |
| New OpenAPI feature        | Fixture coverage, plus a Swagger 2.0 case if it applies there       |
| Naming or identifier logic | Unit tests in `test/naming.test.ts`                                 |
| CLI behaviour              | Test it end to end, not only the internals                          |

**Add to `edge-cases.yaml` instead of creating a new fixture.** It's the regression suite, and it's useful to have every
shape that has ever broken the generator in one file.

**Read your snapshot diffs.** When `npm test -- -u` changes a snapshot, look at what changed. If you can't explain why
the output changed, that's probably the bug.

**Test behaviour, not formatting.** Generated output uses the user's Prettier config, so the quote style can vary. Match
either one:

```ts
expect(queries).toMatch(/queryKey: \['pets'\]|queryKey: \["pets"\]/)
```

## Errors

Errors shown to users should say where the problem is and, when possible, how to fix it:

```
error: cannot resolve schema
  at paths./users.get.responses.200
  in openapi.yaml:42

  Check that the $ref target exists in components.schemas.
```

Use `QueryFishError` or `SpecError` with `file`, `pointer` and `hint`. A bare stack trace leaves the user searching
through thousands of lines of YAML.

## Dependencies

The dependency list is short on purpose. If you want to add one, explain why in the PR, and check first whether Node's
standard library or an existing dependency already covers it.

Never add a dependency that the generated output would need at runtime.

## Pull requests

- Branch from `main`.
- Add a changeset (`npx changeset`) for anything users will notice. See [versioning.md](./versioning.md).
- `npm test`, `npm run typecheck`, `npm run lint` and `npm run format:check` all pass.
- Explain why in the description. The diff shows what.
- For anything large, open an issue first so we can agree on the approach before you spend the time.

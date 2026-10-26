# 0002. Four-stage pipeline with an intermediate representation

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

The obvious way to build a code generator is to walk the OpenAPI document and print TypeScript as you go. It's less code,
and for a single output it works fine.

QueryFish has three problems that don't fit that approach:

1. **Recursive schemas.** Whether `Comment.replies` becomes `Comment[]` or an inline expansion depends on which schemas
   have names. That's a question about the whole document, not the current node.
2. **Name collisions.** Duplicate and missing `operationId`s have to be resolved the same way across the whole spec.
3. **Several outputs from the same operations.** `types.ts`, `requests.ts`, `queries.ts` and `mutations.ts` all describe
   the same operations. Walking the spec four times means solving 1 and 2 four times, each a little differently.

The roadmap makes this worse. Zod schemas, MSW handlers and plugins are all more outputs over the same operations.

## Decision

QueryFish runs in four stages, each a pure function that can be tested on its own:

```
loader/  spec → self-contained document
ir/      document → Operation[] + named types
emit/    IR → TypeScript source strings
write/   format, diff, write   (in generate.ts)
```

The IR (`src/ir/types.ts`) is the contract between them. **Emitters never read the raw OpenAPI document.** If an emitter
needs something the IR doesn't have, the IR gets extended.

## Consequences

### What this enables

- Cycles, naming and pagination are handled once, in `ir/`, and every emitter benefits.
- An emitter is just `(ir, config) => string`, which is small enough to be a realistic first contribution.
- Each new output on the roadmap is a new file in `emit/`, not a rewrite. This is the main reason the IR exists.
- Stages can be tested separately. `test/naming.test.ts` never loads a spec file.

### What this costs

- More indirection than walking the spec directly. To see how `/pets/{petId}` turns into `useGetPet` you have to follow
  it through three modules.
- Supporting new spec data in an emitter means changing the IR first, which is an extra step.
- Some OpenAPI detail is dropped at the IR boundary on purpose. Getting it back later means an IR change, not a local
  fix.

### What we rejected

**Generating strings straight from the spec.** Rejected because of the recursion and naming problems above, and because
it would turn plugins into a rewrite instead of an addition.

**Building an AST with the TypeScript compiler API.** More correct in theory, but much slower to write and much harder to
read in review. It would also make the snapshot tests useless for reviewing emitter changes, and that's how we review
them here.

**Templates (Handlebars, EJS).** Familiar to a lot of people, but type-aware logic (like when to add parentheses around a
union inside an array) ends up either in helpers or copied across templates. Building strings in TypeScript keeps that
logic type-checked.

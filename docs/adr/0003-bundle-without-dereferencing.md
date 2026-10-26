# 0003. Bundle specs without dereferencing

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

`@redocly/openapi-core` has `bundle({ ref, config, dereference })`. With `dereference: true`, every `$ref` is inlined,
so later code never has to resolve pointers. That's the obvious choice, and it's what QueryFish was first built on.

It breaks on recursive schemas, and those are common: `Comment.replies`, `Category.children`, `Node`/`Edge` pairs.

Here's what happens with `test/fixtures/edge-cases.yaml`:

```js
const res = await bundle({ ref, config, dereference: true })
const Comment = res.bundle.parsed.components.schemas.Comment
const nested = Comment.properties.replies.items

nested === Comment // false: it's a copy, not the same object
nested.$ref // undefined: the pointer is gone
nested.properties.replies.items === nested // true: the copy points to itself
JSON.stringify(res.bundle.parsed) // throws: Converting circular structure to JSON
```

That causes two problems:

1. **The document is circular.** A plain recursive walk never ends.
2. **The recursion can't be expressed any more.** The nested object is a copy, so comparing it against the registered
   components doesn't match. The generator has no way to know that the nested schema is `Comment`. The best it can do is
   inline one level and give up:

    ```ts
    export interface Comment {
        replies?: { id: string; replies?: unknown }[] // wrong
    }
    ```

The second one is the real problem. A cycle guard stops the infinite loop, but it can't bring back the information that
dereferencing threw away.

Bundling without `dereference` still gives a single self-contained document (remote and cross-file refs are pulled in),
but internal pointers are kept, and the document has no cycles and can be serialized.

## Decision

QueryFish bundles with `dereference: false` (`src/loader/load.ts`).

`SchemaConverter` registers every `#/components/schemas` and `#/definitions` entry up front, mapping each JSON pointer to
the type name it will be emitted as. A `$ref` to a registered schema becomes `{ kind: 'ref', name }`. Any other pointer
is resolved by hand, with a guard for pointers that are already being resolved.

## Consequences

### What this enables

- Recursive and mutually recursive schemas come out right: `replies?: Comment[]`, `edge?: Edge`.
- The document has no cycles, so you can log it, inspect it and diff it while debugging.
- Named schemas become named TypeScript types, which is a big part of why the generated code is readable instead of a
  pile of nested anonymous objects.

### What this costs

- `SchemaConverter` needs pointer resolution logic it wouldn't otherwise need (`resolvePointer` and the `inProgress`
  set).
- It has to handle both `#/components/schemas/` (OpenAPI 3) and `#/definitions/` (Swagger 2) pointers.
- Anyone who assumes the document is dereferenced (a reasonable assumption) will be surprised. That's why there's a
  comment at the top of `src/loader/load.ts` and this ADR.

### What we rejected

**`dereference: true` with a WeakSet cycle guard.** This was the first implementation. It stopped the infinite loop but
still emitted `replies?: unknown`, because the information needed to emit `Comment` was already gone. The test
"emits self-referential types by name" in `test/generate.test.ts` caught it.

**Dereferencing, then working out the names again by comparing structures.** Deep-comparing every nested schema against
every component is quadratic and fragile, and it can't tell apart two components that happen to have the same shape.

**Writing our own `$ref` resolver.** Redocly already handles remote refs, cross-file refs and Swagger 2. Not worth
rebuilding all that to avoid one option.

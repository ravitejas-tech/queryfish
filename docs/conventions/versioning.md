# Versioning and releases

QueryFish follows [Semantic Versioning](https://semver.org/).

## What's different for a code generator

Most libraries only have to version their API. QueryFish has two things users depend on:

1. **The tool itself**: the CLI, `defineConfig`, and the exported functions.
2. **The generated code**: the hooks, types and functions users actually import and call.

The second one is easy to forget. A change can leave the CLI and config exactly the same and still break every user,
because their app is written against the generated code. Renaming a generated hook breaks people just as much as renaming
an exported function, even though nothing in `src/index.ts` changed.

**The rule: if someone regenerates and their app stops compiling or behaves differently, it's a breaking change, no
matter what changed internally.**

## What each bump means

### Major: user code breaks after regenerating

- Names of generated hooks, types or request functions change
- The shape of query keys changes (invalidation calls quietly stop matching)
- The variables or response type of a generated hook changes shape
- The `QueryFishClient` interface gets a new required member
- A config option is removed or starts meaning something else
- The minimum supported Node or TypeScript version goes up
- Output that used to compile doesn't any more

Query keys need extra care. If they change, `invalidateQueries({ queryKey: [...] })` calls stop matching at runtime and
there's no type error to warn anyone. Treat any key change as major. See
[ADR 0004](../adr/0004-path-segment-query-keys.md).

### Minor: something new, existing output unaffected

- A new emitter or output file
- A new config option whose default keeps the old behaviour
- Support for OpenAPI features that used to come out as `unknown`
- New CLI flags
- Better JSDoc, or types that get more specific in a way that can't break a caller

### Patch: fixes

- Generated code that didn't compile now does
- Bug fixes in schema conversion, naming or `$ref` resolution
- Whitespace and formatting changes in the output
- Better error messages
- Documentation

## Fixing wrong output

Fixing output that was wrong can still break someone who worked around the bug. Use your judgement:

- **The output didn't compile** → patch. Nobody could have depended on it.
- **The output compiled but was wrong at runtime** → patch, and say so clearly in the changeset. Anyone hitting it was
  already broken.
- **The output worked but wasn't ideal** → at least minor, and major if names or keys change.

If you can't decide, go with the bigger bump. An unexpected major version is a small annoyance. An unexpected break turns
into a bug report.

## Changesets

Releases are managed with [Changesets](https://github.com/changesets/changesets).

Add one for any change users will notice:

```bash
npx changeset
```

Pick the bump, then write the entry for someone reading the changelog, not for the person reviewing your PR:

```md
---
'queryfish': patch
---

Fix `$ref` resolution inside `allOf` members. Components referenced from within
a composition schema now emit the named type instead of `unknown`.
```

Changes users won't notice (internal refactors, tests, CI) don't need a changeset, and CI doesn't require one. If it
did, people would just start adding empty ones.

One exception: the README is published to npm, and npm only picks up README changes when a new version is released. If
you want a README fix to show up on npm, add a patch changeset for it.

### Breaking changes

Say what breaks and how to fix it. People read this when they're deciding whether to upgrade:

```md
---
'queryfish': major
---

Query keys now use URL path segments instead of `operationId`.

Invalidation calls must be updated:

    // before
    queryClient.invalidateQueries({ queryKey: ['getPet'] });
    // after
    queryClient.invalidateQueries({ queryKey: ['pets', '{petId}'] });

In exchange, a prefix now invalidates a whole resource tree:
`{ queryKey: ['pets'] }` clears every pet query.
```

## How releases happen

`.github/workflows/release.yml` does it all:

1. PRs with changesets get merged into `main`.
2. The workflow opens (or updates) a **Version Packages** PR that applies the pending bumps and updates `CHANGELOG.md`.
3. Merging that PR publishes to npm with provenance and tags the release.

Nobody runs `npm publish` by hand, and nobody edits `version` in `package.json` directly.

Since 1.0.0, the generated output is considered stable, so everything above applies as written: breaking changes mean a
new major version.

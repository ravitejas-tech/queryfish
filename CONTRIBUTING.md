# Contributing to QueryFish

Thanks for taking a look. This guide should be enough to get from a fresh clone to a merged PR. If something's missing
or unclear, please open an issue about that too.

## Getting started

```bash
git clone https://github.com/ravitejas-tech/queryfish.git
cd queryfish
npm install
npm test
```

You need Node 20.19 or newer. There's no build step for development and nothing external to set up.

Scripts you'll use:

| Command              | What it does                |
| -------------------- | --------------------------- |
| `npm test`           | Run all tests               |
| `npm run test:watch` | Re-run tests as you edit    |
| `npm run typecheck`  | Type-check without emitting |
| `npm run build`      | Build the package           |
| `npm run lint`       | Lint                        |
| `npm run format`     | Format with Prettier        |

## How the code is laid out

[docs/architecture.md](./docs/architecture.md) explains the four-stage pipeline and why it's built that way. The short
version:

```
loader/  spec → one bundled document ($refs kept)
ir/      document → Operation[] + named types
emit/    IR → TypeScript source strings
         (generate.ts then formats, diffs and writes)
```

The one rule to remember: **emitters never read the raw OpenAPI document.** If an emitter needs something the IR doesn't
have, add it to the IR.

## Tests

There are three kinds, and they catch different problems:

- **Unit tests** (`test/naming.test.ts`) cover how identifiers are derived and how collisions are resolved.
- **Snapshot tests** (`test/generate.test.ts`) store the full generated output for each fixture in the repo. When you
  change an emitter, the snapshot diff in your PR shows exactly what users will get, which is what reviewers look at.
  Update them with `npm test -- -u`, and read the diff before you commit it.
- **Compile tests** (`test/compile.test.ts`) generate each fixture into a temp folder and run `tsc` over it against the
  real `react-query-kit`. Snapshots only show that the output didn't change. These show that it compiles, which for a
  code generator is the more important of the two.

### Fixtures

- `petstore.yaml` is a realistic spec covering the common cases.
- `edge-cases.yaml` collects the things that tend to break generators: circular `$ref`s, missing and duplicate
  `operationId`s, reserved words, `allOf`/`oneOf`, 204 responses, and parameter names that aren't valid identifiers.
  **If you fix a bug, add a case here.**
- `swagger2.json` is a Swagger 2.0 spec, which is different enough to need its own fixture.

## Common changes

### Adding an emitter

This is the most likely contribution (Zod schemas, MSW handlers and so on):

1. Add `src/emit/<name>.ts` exporting `(ir, config) => string`.
2. Register it in `src/generate.ts`.
3. If it should be optional, add a config flag in `src/config/define.ts`.
4. Run `npm test -- -u` and commit the snapshot.

### Fixing a generation bug

1. Add the spec shape that breaks to `test/fixtures/edge-cases.yaml`.
2. Check that the tests fail.
3. Fix it in `ir/` or `emit/`.
4. Run `npm test -- -u`, read the snapshot diff, and commit.

### Supporting more of OpenAPI

Most of this lives in `src/ir/schema.ts` (schema shapes) or `src/ir/build.ts` (anything at the operation level). Check
whether the IR can already express what you need before adding to it.

## Conventions

There are three short docs. Have a quick look before your first PR:

- [Commits](./docs/conventions/commits.md): Conventional Commits, with scopes that match the pipeline stages.
- [Code style](./docs/conventions/code-style.md): the architectural rules, how we write comments, and which tests each
  kind of change needs.
- [Versioning](./docs/conventions/versioning.md): how to pick a version bump. For a code generator, "breaking" means the
  generated code breaks someone's app.

Bigger decisions are written up as [ADRs](./docs/adr/). If something looks wrong and you're about to change it, check
there first. It might be on purpose, and the reasons (and the alternatives already tried) will be written down.

## Pull requests

- Branch from `main`.
- Follow the [commit convention](./docs/conventions/commits.md).
- Add a changeset with `npx changeset`. [Versioning](./docs/conventions/versioning.md) explains which bump to pick.
- Make sure `npm test`, `npm run typecheck`, `npm run lint` and `npm run format:check` pass.
- In the description, explain why you made the change. The diff already shows what changed.

Small PRs get reviewed faster. If you're planning something big, open an issue first so we can agree on the approach
before you put the time in.

## Design principles

These shape what gets merged, so they're worth knowing before you propose something:

1. **No runtime.** Generated code depends on `react-query-kit`, `@tanstack/react-query` and the user's own client
   module, and nothing else. QueryFish itself should never need to be installed in production.
   ([ADR 0006](./docs/adr/0006-user-supplied-http-client.md))
2. **Don't guess.** Where OpenAPI has no standard (pagination is the big one), QueryFish asks for an explicit opt-in
   instead of inferring. A wrong guess still compiles, so nobody finds out until it misbehaves at runtime.
   ([ADR 0005](./docs/adr/0005-opt-in-pagination.md))
3. **Generated code should look hand-written.** People commit it, review it and debug it.
4. **Generated code has to compile.** The compile tests check this on every run.
   ([ADR 0007](./docs/adr/0007-verify-generated-code-compiles.md))
5. **Errors say where.** If the generator fails with a bare stack trace, the user has to dig through thousands of lines
   of YAML to find the problem.

## Code of conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md).

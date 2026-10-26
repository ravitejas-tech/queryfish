# Commit messages

QueryFish uses [Conventional Commits](https://www.conventionalcommits.org/). Commit messages get read a lot more often
than they get written, usually by someone trying to track down a regression.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Only the first line is required.

### Example

```
fix(ir): resolve $ref inside allOf members

Composition schemas were converted before pointer resolution, so a component
referenced from inside allOf inlined as `unknown` instead of emitting the
named type.

Fixes #42
```

## Types

| Type       | Use for                                | Version impact |
| ---------- | -------------------------------------- | -------------- |
| `feat`     | New capability                         | minor          |
| `fix`      | Bug fix                                | patch          |
| `perf`     | Performance, no behaviour change       | patch          |
| `refactor` | Restructuring with no behaviour change | none           |
| `docs`     | Documentation only                     | none           |
| `test`     | Tests only                             | none           |
| `build`    | Build system, bundling, dependencies   | none           |
| `ci`       | CI configuration                       | none           |
| `chore`    | Anything else (tooling, housekeeping)  | none           |

The version impact column is a guide. The changeset is what actually decides the release. See
[versioning.md](./versioning.md).

## Scopes

Scopes match the pipeline stages, so you can tell which part changed without opening the diff:

| Scope     | Covers                                             |
| --------- | -------------------------------------------------- |
| `loader`  | `src/loader/`: spec loading, bundling, spec errors |
| `ir`      | `src/ir/`: the IR, schema conversion, naming       |
| `emit`    | `src/emit/`: all emitters                          |
| `cli`     | `src/cli/`: commands, flags, output, watch         |
| `config`  | `src/config/`: config loading, `defineConfig`      |
| `example` | `examples/`                                        |
| `adr`     | `docs/adr/`                                        |
| `website` | `website/`                                         |

Leave the scope out if a change really does touch everything. Don't make up a new scope for a single commit.

## Subject line

- Use the imperative: "add", not "added" or "adds". It should finish the sentence "If applied, this commit will ...".
- Lowercase first letter, no full stop at the end.
- Keep it under 72 characters.
- Describe the change, not the files. `fix(emit): quote invalid property names` is better than
  `fix(emit): update types.ts`.

## Body

Optional, but add one whenever the change isn't obvious.

Explain why. The diff already shows what. The most useful bodies answer "why is this the right fix?" or "what breaks
without this?".

Wrap at 80 characters, with a blank line after the subject.

If the change relates to an architectural decision, mention the ADR:

```
See docs/adr/0003-bundle-without-dereferencing.md
```

## Footer

- `Fixes #123` or `Closes #123` to link an issue.
- `Co-Authored-By: Name <email>` if you paired with someone.
- Breaking changes:

```
BREAKING CHANGE: query keys now use path segments instead of operationId.

Invalidation calls written against the old keys must be updated:
  before: invalidateQueries({ queryKey: ['getPet'] })
  after:  invalidateQueries({ queryKey: ['pets', '{petId}'] })
```

For a code generator, "breaking" usually means **the generated output changed in a way that breaks user code**. See
[versioning.md](./versioning.md) for what counts.

## A few habits

**One change per commit.** If the subject needs an "and", it's probably two commits.

**Commit snapshot updates with the change that caused them.** A snapshot change on its own, or an emitter change without
its snapshot, doesn't make sense to a reviewer.

**Every commit on `main` should pass CI.** Don't commit something broken and fix it in the next commit. It makes
`git bisect` much less useful.

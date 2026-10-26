# QueryFish docs

These are mostly for contributors. If you just want to use QueryFish, the main [README](../README.md) or
[queryfish.dev](https://queryfish.dev) is the better place to start.

## Start here

- [architecture.md](./architecture.md): how the generator works. Read this first if you want to contribute.
- [CONTRIBUTING.md](../CONTRIBUTING.md): setup, tests and how to send a PR.

## Decisions

- [adr/](./adr/): Architecture Decision Records. Each one explains why something works the way it does, and which
  alternatives were turned down. Read the relevant one before changing that part of the code.

## Conventions

- [conventions/commits.md](./conventions/commits.md): commit message format, types and scopes.
- [conventions/code-style.md](./conventions/code-style.md): the rules a linter can't check, comments, and which tests a
  change needs.
- [conventions/versioning.md](./conventions/versioning.md): how we pick version bumps. For a code generator, "breaking"
  means the generated code breaks your app.

## Roadmap

- [roadmaps/v1.0.md](./roadmaps/v1.0.md): what shipped in 1.0 and what's planned next.

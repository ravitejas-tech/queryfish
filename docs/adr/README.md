# Architecture Decision Records

An ADR records a decision that was hard to make and would be expensive to undo: the situation at the time, what we
chose, and what it costs.

Here's why we bother. Six months from now, someone will look at `bundle({ dereference: false })` and think "that looks
wrong, I'll fix it." The ADR is how they find out it was on purpose, and what broke last time.

## Index

| #                                                | Decision                                | Status   |
| ------------------------------------------------ | --------------------------------------- | -------- |
| [0001](./0001-record-architecture-decisions.md)  | Record architecture decisions           | Accepted |
| [0002](./0002-four-stage-pipeline-with-an-ir.md) | Four-stage pipeline with an IR          | Accepted |
| [0003](./0003-bundle-without-dereferencing.md)   | Bundle specs without dereferencing      | Accepted |
| [0004](./0004-path-segment-query-keys.md)        | Query keys are URL path segments        | Accepted |
| [0005](./0005-opt-in-pagination.md)              | Pagination is opt-in, never inferred    | Accepted |
| [0006](./0006-user-supplied-http-client.md)      | The HTTP client is supplied by the user | Accepted |
| [0007](./0007-verify-generated-code-compiles.md) | Verify that generated code compiles     | Accepted |

## When to write one

Write an ADR when a choice:

- is expensive to undo later (the public API, the shape of generated output, the IR),
- will look wrong to someone who wasn't around when it was made,
- was picked over a reasonable alternative, or
- comes from a constraint you can't see in the code.

Don't write one for things the code already makes obvious. A function name isn't a decision record.

## Adding one

1. Copy [`template.md`](./template.md) to `NNNN-short-title.md`, using the next number.
2. Fill it in. Be specific about what you gave up. The Consequences section is the part people come back to.
3. Add a row to the index above.
4. Link to it from the code where the decision applies, e.g. `// See docs/adr/0003-bundle-without-dereferencing.md`.

## Changing a decision

Don't edit the decision in an accepted ADR. The point is to keep a record of what we thought at the time. Instead:

1. Write a new ADR that replaces it.
2. Mark the old one `Superseded by [NNNN](./NNNN-….md)`.
3. Update the index.

# 0001. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

The first version of QueryFish was built in one go, and a few of its choices look wrong at first glance:

- The loader doesn't dereference `$ref`s, even though that's the obvious thing to do with an OpenAPI parser.
- `createInfiniteQuery` is supported but generates nothing by default.
- Query keys are `['pets', '{petId}']` rather than the operation name.

Each of these was done for a specific reason, and at least one of those reasons only came up after the obvious version
failed a test. Right now that reasoning is spread across commit messages and `docs/architecture.md`, and nobody reads
either of those before opening a PR that undoes it.

If we want outside contributors, they need a way to find out why something is the way it is without having to ask.

## Decision

QueryFish keeps Architecture Decision Records in `docs/adr/`, in Michael Nygard's format: numbered, not edited once
accepted, and replaced by a new ADR when a decision changes.

The decisions already in the code are recorded after the fact, since those are the ones a new contributor is most likely
to trip over.

## Consequences

### What this enables

- Someone who disagrees with a decision can read the reasoning and the alternatives before spending time on a PR.
- Code can point to the reasoning. A one-line comment linking an ADR is better than the same paragraph copied into three
  files.
- When a decision turns out to be wrong, it gets replaced with a visible trail instead of being quietly reverted and
  argued about again later.

### What this costs

- Each significant decision now needs a document. That's some extra work, but if a decision isn't worth 15 minutes of
  writing, it probably isn't an architectural one.
- ADRs go stale if nobody updates them. The index in `README.md` and the status field help with that.

### What we rejected

**Only comments in the code.** Fine for local reasoning, but a decision that touches the loader, the IR and two emitters
has no single place to live, and there's nowhere to put the alternatives.

**One big DECISIONS.md.** Simpler at first, but it turns into a long file nobody reads, and there's no clean way to
replace one decision in it.

**Nothing, just git history.** Commit messages are good for what changed, not for what's true now. To find a decision
you'd need to know which commit to look at, and a newcomer won't.

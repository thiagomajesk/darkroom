# Friendly Architecture

## Operating Principles

- Align folder structure with your domain mental model.
- Prefer deep modules over many shallow modules.
- Expose a narrow, explicit public interface per module.
- Hide implementation details behind stable boundaries.
- Design for progressive disclosure: interface first, internals second.
- Protect boundaries from ad-hoc cross-feature imports.
- Keep feedback loops fast with focused contract tests.

## Module Shape

Use one folder per module/service/capability and make entry points obvious.

```text
<module>/
  index.ts          # public API only
  types.ts          # contracts shared with callers
  internal/*        # implementation details
  tests/*           # behavioral and contract tests
```

Keep imports from other modules pointed at `index.ts` (or equivalent public API), not internal files.

## Change Workflow

1. Identify the capability being changed and its owning module.
2. Confirm whether the needed behavior fits the existing public interface.
3. If needed, evolve the interface first (types, signatures, documented behavior).
4. Define or update contract tests at the module boundary.
5. Implement internal changes behind the interface.
6. Run fast local checks first (module tests), then broader integration checks.
7. Reject changes that create new hidden coupling across module boundaries.

## Interface Review Heuristics

- Keep interface names business-meaningful, not implementation-leaky.
- Export the minimum surface needed for current consumers.
- Group related operations into one coherent module boundary.
- Split modules only when responsibilities are truly independent.
- Avoid pass-through wrappers that add no abstraction value.

## Testing Guidance

- Prefer boundary-level tests that lock behavior, not internal structure.
- Use integration tests to verify module interactions.
- Keep unit tests inside modules focused on non-trivial internal logic.
- Ensure failures identify which module contract regressed.
- Optimize test runtime so AI receives feedback quickly.

## Planning Prompts

Use these prompts during planning or implementation issue writing:

- Which module should own this behavior?
- What is the smallest interface change that supports the requirement?
- What coupling does this introduce or remove?
- Which tests prove the boundary still behaves correctly?
- Can a new contributor find this logic in under five minutes?

## Anti-Patterns To Avoid

- Scattering one feature across many unrelated folders.
- Importing internals across module boundaries.
- Growing many tiny utility modules with unclear ownership.
- Forcing developers to understand internals just to use a capability.
- Adding architecture rules without tests or tooling enforcement.

## Minimal Enforcement Ideas

- Add lint/import rules that block cross-boundary internal imports.
- Keep module ownership notes close to code.
- Require interface and test updates in PRs that change behavior.
- Periodically consolidate shallow modules into deeper, coherent ones.

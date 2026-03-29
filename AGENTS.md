## Workflow

- Never silently fill in ambiguous requirements
- Always prefer declarative over imperative code
- Prefer the simplest solution that could reasonably work
- Only change what was explicitly requested and nothing more
- Provide a brief execution plan before writing or changing code
- Define tests or success criteria before implementing non-trivial logic
- Start with a naive, obviously correct implementation before optimizing
- When stuck or uncertain, describe what is unclear and what was attempted
- Prefer smaller or incremental changes instead of big changes when refactoring code
- When the plans has conflicts, present options or trade-offs and wait for confirmation
- Before non-trivial work, if you have assumptions, ask for confirmation before proceeding
- When there is a contradiction or missing information, state the confusion and wait for resolution
- Push back on incorrect, risky, or poorly-scoped instructions and propose safer or simpler alternatives
- Every bug that is fixed needs an accompanying regression test: 
    - Step 1: Create a test case that reproduces/ confirms the bug (test passes)
    - Step 2: Adjust the test expectations so it requires the correct behavior (test fails)
    - Step 3: Implement the fix by making the now correct expectations work (test passes)
- Never utilize of clever hacks or keep abstractions around just because of "compatibility". Instead, prefer to create an updated mental model and adjust the implementation to better fit the use cases we need to support. When in doubt, prioritize planning and confirming before proceeding with changes.

## Tasks

- Commit using the conventional commits convention and make changes extra-explicit
- When working on features and fixes, split tasks so you can deliver gradual commits
- Remember to commit often, every commit should ensure a working-state of the project

## UI/UX & design guidelines

- **Produce world-class UI designs** with a focus on usability, aesthetics, and modern design principles
- Implement **subtle micro-interactions** (e.g., button hover effects, and smooth transitions)
- Ensure **clean typography, spacing, and layout balance** for a refined, premium look
- Focus on **delightful details** like hover effects, loading states, and smooth page transitions

## Skills

- Before starting any task, ensure you are always using the appropriate skill available
- If there's no skill available, you can search for one using https://skills.sh/ tooling
- Keep the skills in .agents/skills in sync to what is needed for this project at all times

## Documentation

- Keep a good descriptive README.md that is begginer-friendly
- When writting documentation, consider non-tech people as the main audience

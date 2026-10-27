# EmuDev Academy

Interactive RPG-style platform to learn how to build emulators, inspired by
[codedex.io](https://www.codedex.io/). Players advance through the regions of a map: each region
is a system (CHIP-8, Game Boy, NES, GBA… up to working on a fork of Eden for Switch), and every
lesson awards XP, levels and badges. The UI itself evolves era by era as the player progresses.

> Status: early development. The full roadmap is in [PLAN.md](PLAN.md). The app's UI and lessons
> are in Spanish.

## Requirements

- Node.js 24 (see `.nvmrc`)
- npm 11

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Script                  | What it does                                       |
| ----------------------- | -------------------------------------------------- |
| `npm run dev`           | Vite development server                            |
| `npm run build`         | Production build in `dist/`                        |
| `npm run preview`       | Serves the build locally                           |
| `npm run lint`          | Strict ESLint (fails on any warning)               |
| `npm run lint:fix`      | ESLint with autofix                                |
| `npm run format`        | Formats with Prettier                              |
| `npm run format:check`  | Checks formatting                                  |
| `npm test`              | Runs the tests with Vitest                         |
| `npm run test:watch`    | Vitest in watch mode                               |
| `npm run test:coverage` | Tests with coverage (80% threshold)                |
| `npm run check`         | Lint, format check, coverage and build, same as CI |

## Contributing

1. Create a branch from `main`.
2. Write commits following [Conventional Commits](https://www.conventionalcommits.org/)
   (validated by commitlint in the `commit-msg` hook).
3. Open a PR using the template. The title must also be a Conventional Commit, because PRs are
   squash-merged. Commits, PRs and docs are written in English.
4. Git hooks run the checks for you: `pre-commit` lints, formats and tests the staged files;
   `pre-push` runs `npm run check`. Required PR checks: `lint`, `test`, `build` and `pr-title`.
5. On merge to `main`, semantic-release computes the version, publishes the GitHub Release with
   the build attached and deploys to GitHub Pages.

See [CLAUDE.md](CLAUDE.md) for conventions and architecture.

## Licenses

- Platform code: [AGPL-3.0-only](LICENSE).
- Educational content (lessons, exercises, original art):
  [CC BY-NC-SA 4.0](LICENSE-CONTENT.md).
- Third-party ROMs and assets keep their own license, documented next to them.
